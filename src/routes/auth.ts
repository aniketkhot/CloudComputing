import { Router } from 'express';
import { signToken } from '../services/jwt';
const router = Router();

const USERS = [
  { username: 'admin', password: 'password123', role: 'admin' as const },
  { username: 'lenged', password: 'password123', role: 'user'  as const },
];

router.post('/login', (req, res) => {

  const { username, password } = req.body || {};
  const u = USERS.find(x => x.username === username && x.password === password);
  if (!u) return res.status(401).json({ error: 'Invalid credentials' });
  
  const token = signToken(u.username, u.role);
  res.json({ token });
});

export default router;
