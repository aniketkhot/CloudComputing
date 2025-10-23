import { Router, Request, Response } from "express";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  AuthFlowType,
} from "@aws-sdk/client-cognito-identity-provider";
import crypto from "crypto";
import { getConfig } from "../config";
import { getCognitoSecret } from "../services/secrets";
import type { CognitoSecret } from "../services/secrets";

const router = Router();

const { region: cfgRegion } = getConfig();
const region = cfgRegion || process.env.AWS_REGION || "ap-southeast-2";

const cognito = new CognitoIdentityProviderClient({ region });


const secretPromise: Promise<CognitoSecret> = getCognitoSecret();

async function secretHash(username: string): Promise<string> {
  const { "client-id": clientId, "client-secret": clientSecret } = await secretPromise;
  return crypto.createHmac("sha256", clientSecret).update(username + clientId).digest("base64");
}

// POST /api/auth/register { username, password, email }
router.post("/register", async (req: Request, res: Response) => {
  const { username, password, email } = req.body || {};
  if (!username || !password || !email) return res.status(400).json({ error: "username, password, email required" });
  try {
    const { "client-id": clientId } = await secretPromise;
    await cognito.send(new SignUpCommand({
      ClientId: clientId,
      Username: username,
      Password: password,
      SecretHash: await secretHash(username),
      UserAttributes: [{ Name: "email", Value: email }],
    }));
    res.json({ ok: true, message: "Check email for confirmation code." });
  } catch (e: any) {
    res.status(400).json({ error: e?.name || e?.message || "Sign up failed" });
  }
});

// POST /api/auth/confirm { username, code }
router.post("/confirm", async (req: Request, res: Response) => {
  const { username, code } = req.body || {};
  if (!username || !code) return res.status(400).json({ error: "username, code required" });
  try {
    const { "client-id": clientId } = await secretPromise;
    await cognito.send(new ConfirmSignUpCommand({
      ClientId: clientId,
      Username: username,
      ConfirmationCode: code,
      SecretHash: await secretHash(username),
    }));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e?.name || e?.message || "Confirm failed" });
  }
});

// POST /api/auth/login { username, password }
router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "username, password required" });
  try {
    const { "client-id": clientId } = await secretPromise;
    const out = await cognito.send(new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: await secretHash(username),
      },
    }));
    const idToken = out.AuthenticationResult?.IdToken;
    const accessToken = out.AuthenticationResult?.AccessToken;
    const refreshToken = out.AuthenticationResult?.RefreshToken;
    if (!idToken) return res.status(401).json({ error: "Login failed" });
    res.json({ token: idToken, accessToken, refreshToken });
  } catch (e: any) {
    res.status(401).json({ error: e?.name || e?.message || "Login failed" });
  }
});

export default router;
