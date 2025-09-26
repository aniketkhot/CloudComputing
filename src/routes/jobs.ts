// import { Router } from 'express';
// import { requireAuth as authMiddleware } from '../services/jwt';
// import { db } from '../services/db';

// const router = Router();

// router.get('/:jobId', authMiddleware, (req: any, res) => {
//   const j = db.getJob(req.params.jobId);
//   if (!j || (j.owner !== req.user.sub && req.user.role !== 'admin')) return res.status(404).end();
//   res.json(j);
// });

// export default router;
