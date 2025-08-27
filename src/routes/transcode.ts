import { Router } from 'express';
import path from 'path';
import { nanoid } from 'nanoid';
import { authMiddleware } from '../services/jwt';
import { db } from '../services/db';
import { transcode } from '../services/ffmpeg';

const router = Router();

router.post('/', authMiddleware, async (req: any, res) => {
  const { fileId, preset } = req.body || {};
  if (!['720p','480p'].includes(preset)) return res.status(400).json({ error: 'preset must be 720p or 480p' });

  const f = db.getFile(fileId);
  if (!f || (f.owner !== req.user.sub && req.user.role !== 'admin')) return res.status(404).end();

  const jobId = nanoid();
  db.insertJob({ id: jobId, owner: req.user.sub, fileId, preset, status: 'queued', startedAt: Date.now() });


  // for load testing may need to call this in a loop : todo
  //how to make this call an async one : todo
  setImmediate(async () => {
    db.updateJob(jobId, { status: 'running' });
    try {
      const base = path.parse(f.storedPath).name;
      const outPath = path.join(path.dirname(f.storedPath), `${base}_${preset}.mp4`);
      await transcode(f.storedPath, outPath, preset as '720p'|'480p');
      db.updateJob(jobId, { status: 'done', finishedAt: Date.now(), outputPath: outPath });
    } catch (e: any) {
      db.updateJob(jobId, { status: 'error', finishedAt: Date.now(), logs: String(e).slice(0, 5000) });
    }
  });

  res.json({ jobId });
});

export default router;
