import { CognitoJwtVerifier } from "aws-jwt-verify";
import { Request, Response, NextFunction } from "express";

const region = process.env.AWS_REGION || "ap-southeast-2";
const userPoolId = process.env.COGNITO_USER_POOL_ID || "ap-southeast-2_VBlfPVnT5";
const clientId   = process.env.COGNITO_CLIENT_ID || "29h0gdv9mua4nin2j8nrna4356";
const clientSecret = process.env.COGNITO_CLIENT_SECRET|| "66532r97ecgorsmjse3paikqi7r7i0jmf18kmfr4rs9p0727o3c";


const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID || userPoolId,
  clientId: process.env.COGNITO_CLIENT_ID || clientId,
  tokenUse: "id", // we return the ID token as `token`
});

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const raw = req.headers.authorization || "";
    const token = raw.startsWith("Bearer ") ? raw.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Missing token" });
    const payload = await verifier.verify(token);   // mirrors your demo verification step :contentReference[oaicite:3]{index=3}
    (req as any).user = payload; // contains sub, email, cognito:groups, etc.
    next();
  } catch (e: any) {
    res.status(401).json({ error: "Invalid token" });
  }
}
