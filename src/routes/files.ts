import { Router, Request, Response } from "express";
import fileUpload from "express-fileupload";
import { nanoid } from "nanoid";
import { requireAuth } from "../services/jwt";
import { ddb, presignGet, presignPut, s3 } from "../services/aws";
import { videosRepo } from "../services/videosRepo";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createReadStream, promises as fs } from "fs";
import { getConfig } from "../config";

const router = Router();
router.use(fileUpload());

const parameter_name = "/n1234567/demo_parameter";

const {bucket} =  getConfig() //process.env.S3_BUCKET || "cab432-n11672153-videos";               // e.g., cab432-n11672153-videos
const {ddbTable}  = getConfig()//process.env.DDB_TABLE|| "cab432-n11672153-videos";               // e.g., cab432-n11672153-videos
const repo   = videosRepo(ddb, ddbTable);

// GET /api/files/mine
router.get("/mine", requireAuth, async (req: any, res: Response) => {
  const qutUsername = req.user.email;                // Cognito email claim
  const rows = (await repo.listMine(qutUsername)).sort((a,b)=> b.createdAt.localeCompare(a.createdAt));
  if (!rows.length) return res.json({ success: true, message: "You don’t have any files yet." });
  res.json({ success: true, files: rows });
});

// POST /api/files/presign-upload { filename, contentType }
router.post("/presign-upload", requireAuth, async (req: any, res: Response) => {
  const { filename, contentType } = req.body || {};
  if (!filename || !contentType) return res.status(400).json({ error: "filename, contentType required" });

  const qutUsername = req.user.email;
  const sub = req.user.sub;
  const videoId = nanoid();
  const key = `users/${sub}/${videoId}/original/${filename}`;

  const url = await presignPut(bucket, key, contentType);

  await repo.put({
    "qut-username": qutUsername,
    videoId, ownerSub: sub, status: "uploaded",
    bucket: bucket, sourceKey: key, variants: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  });

  res.json({ success: true, fileId: videoId, key, url });
});


// router.post("/upload", requireAuth, async (req: any, res: Response) => {
//   try {
      

//       const f0 = (req.files?.file as any);
     
//       const f = Array.isArray(f0) ? f0[0] : f0;
      
//       if (!f) return res.status(400).json({ error: "file required (multipart 'file')" });
        
//         const { videoId, key } = await uploadToAWS(req, f);

            
//         res.json({ success: true, fileId: videoId, key });
//     } catch (error) {
//    console.log(error) 
//   }  
// });

// POST /api/files/presign-download { key }
router.post("/presign-download", requireAuth, async (req: Request, res: Response) => {
  const { key } = req.body || {};
  if (!key) return res.status(400).json({ error: "key required" });
  const url = await presignGet(bucket, key);
  res.json({ success: true, url });
});

export default router;

export async function uploadToAWS(req: any, f: any) {
  const qutUsername = req.user.email;
  const sub = req.user.sub;
  const videoId = nanoid();
  const key = `users/${sub}/${videoId}/original/${f.name}`;

  // sanity logs
  console.log("uploadToAWS:", { name:f.name, size:f.size, tmp:f.tempFilePath, mime:f.mimetype });

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: createReadStream(f.tempFilePath),  // read from temp file
    ContentType: f.mimetype,
    ContentLength: f.size
  }));

  await repo.put({
    "qut-username": qutUsername,
    videoId, ownerSub: sub, status: "uploaded",
    bucket: bucket, sourceKey: key, variants: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  });

  // clean up temp file
  fs.unlink(f.tempFilePath).catch(()=>{});

  return { videoId, key };
}

// export async function uploadToAWS(req: any, f: any) {
//   const qutUsername = req.user.email;
//   const sub = req.user.sub;
//   const videoId = nanoid();
//   const key = `users/${sub}/${videoId}/original/${f.name}`;

//   await s3.send(new PutObjectCommand({ Bucket: "cab432-n11672153-videos", Key: key, Body: f.data, ContentType: f.mimetype }));

//   await repo.put({
//     "qut-username": qutUsername,
//     videoId, ownerSub: sub, status: "uploaded",
//     bucket: "cab432-n11672153-videos", sourceKey: key, variants: [],
//     createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
//   });
//   return { videoId, key };
// }

