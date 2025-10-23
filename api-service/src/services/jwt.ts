import { CognitoJwtVerifier } from "aws-jwt-verify";
import { Request, Response, NextFunction } from "express";
import { getCognitoSecret } from "./secrets";

let verifierPromise = (async () => {
  const secret = await getCognitoSecret();

  return CognitoJwtVerifier.create({
    userPoolId: secret["pool-id"],
    clientId: secret["client-id"],
    tokenUse: "id", 
  });
})();

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const raw = req.headers.authorization || "";
    const token = raw.startsWith("Bearer ") ? raw.slice(7) : "";
    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    const verifier = await verifierPromise;
    const payload = await verifier.verify(token);

    (req as any).user = payload;
    next();
  } catch (e: any) {
    res.status(401).json({ error: "Invalid token" });
  }
}



