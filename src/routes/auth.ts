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

const router = Router();

const {region} = getConfig(); // process.env.AWS_REGION || "ap-southeast-2";
const userPoolId = process.env.COGNITO_USER_POOL_ID || "ap-southeast-2_VBlfPVnT5";
const clientId   = process.env.COGNITO_CLIENT_ID || "29h0gdv9mua4nin2j8nrna4356";
const clientSecret = process.env.COGNITO_CLIENT_SECRET|| "66532r97ecgorsmjse3paikqi7r7i0jmf18kmfr4rs9p0727o3c";

const cognito = new CognitoIdentityProviderClient({ region });

function secretHash(username: string) {
  const h = crypto.createHmac("sha256", clientSecret);
  h.update(`${username}${clientId}`);
  return h.digest("base64");
}

// POST /api/auth/register { username, password, email }
router.post("/register", async (req: Request, res: Response) => {
  const { username, password, email } = req.body || {};
  if (!username || !password || !email) return res.status(400).json({ error: "username, password, email required" });
  try {
    await cognito.send(new SignUpCommand({
      ClientId: clientId,
      Username: username,
      Password: password,
      SecretHash: secretHash(username),           // ← with client secret (matches your demo) :contentReference[oaicite:0]{index=0}
      UserAttributes: [{ Name: "email", Value: email }],
    }));
    res.json({ ok: true, message: "Check email for confirmation code." });
  } catch (e: any) { res.status(400).json({ error: e.message || "Sign up failed" }); }
});

// POST /api/auth/confirm { username, code }
router.post("/confirm", async (req: Request, res: Response) => {
  const { username, code } = req.body || {};
  if (!username || !code) return res.status(400).json({ error: "username, code required" });
  try {
    await cognito.send(new ConfirmSignUpCommand({
      ClientId: clientId,
      Username: username,
      ConfirmationCode: code,
      SecretHash: secretHash(username),           // ← same as your confirm.js :contentReference[oaicite:1]{index=1}
    }));
    res.json({ ok: true });
  } catch (e: any) { res.status(400).json({ error: e.message || "Confirm failed" }); }
});

// POST /api/auth/login { username, password }
// returns { token: <ID token>, accessToken, refreshToken } to keep your UI happy
router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "username, password required" });
  try {
    const out = await cognito.send(new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: secretHash(username),       
      },
    }));
    const idToken = out.AuthenticationResult?.IdToken;
    const accessToken = out.AuthenticationResult?.AccessToken;
    const refreshToken = out.AuthenticationResult?.RefreshToken;
    if (!idToken) return res.status(401).json({ error: "Login failed" });
    res.json({ token: idToken, accessToken, refreshToken }); // your index.html expects j.token
  } catch (e: any) { res.status(401).json({ error: e.message || "Login failed" }); }
});

export default router;
