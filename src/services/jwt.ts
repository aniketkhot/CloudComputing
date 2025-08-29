import jwt from 'jsonwebtoken';
export type Role = 'admin' | 'user';
export type Claims = { sub: string; role: Role };
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

export function signToken(sub: string, role: Role) {
  return jwt.sign({ sub, role }, JWT_SECRET, { expiresIn: '1h' });
}
export function verifyToken(token: string): Claims {
  return jwt.verify(token, JWT_SECRET) as Claims;
}

// any call with which requires athentication
export function authMiddleware(req: any, res: any, next: any) {
  try {
    const h = req.headers.authorization || '';
    // 
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    req.user = verifyToken(token);
    next();
    //lost the token
    

  } catch {
    
    res.status(401).json({ error: 'Unauthorized' });
  }
}
