import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { authMiddleware } from '../services/jwt';
import { db, FileRec } from '../services/db';

const router = Router();

router.post('/upload', authMiddleware, async (req: any, res) => {
  if (!req.files || !req.files.file) return res.status(400).json({ error: 'file required' });
  const file = req.files.file as any; // UploadedFile 
  const id = nanoid();
  const owner = req.user.sub;

  const dir = path.join(__dirname, '..', 'data', 'files', id);
  fs.mkdirSync(dir, { recursive: true });
  const storedPath = path.join(dir, file.name);

  await file.mv(storedPath); // move the video to files loacaltion, need to make it async?

  const rec: FileRec = { id, owner, originalName: file.name, storedPath, size: fs.statSync(storedPath).size, createdAt: Date.now() };
  db.insertFile(rec);
  res.json({ fileId: id });
});

router.get('/mine', authMiddleware, (req: any, res) => {
  const rows = db.listFilesByOwner(req.user.sub).sort((a,b)=>b.createdAt-a.createdAt);
  res.json(rows);
});

router.get('/:fileId/download', authMiddleware, (req: any, res) => {
  const f = db.getFile(req.params.fileId);
  if (!f || (f.owner !== req.user.sub && req.user.role !== 'admin')) return res.status(404).end();
  const variant = req.query.variant as string|undefined;
  let p = f.storedPath;
  if (variant) {
    const base = path.parse(f.storedPath).name;
    const vp = path.join(path.dirname(f.storedPath), `${base}_${variant}.mp4`);
    if (fs.existsSync(vp)) p = vp;
  }
  res.download(p);
});

export default router;
