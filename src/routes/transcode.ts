import { Router, Request, Response } from "express";
import { requireAuth } from "../services/jwt";
import { ddb, s3 } from "../services/aws";
import { videosRepo } from "../services/videosRepo";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import { createWriteStream, createReadStream, promises as fs } from "fs";
import path from "path";
import { getConfig } from "../config";

ffmpeg.setFfmpegPath(ffmpegPath);

const router = Router();
const {bucket} = getConfig() //process.env.S3_BUCKET || "cab432-n11672153-videos";
const {ddbTable}  = getConfig() // process.env.DDB_TABLE || "cab432-n11672153-videos";
const repo   = videosRepo(ddb, ddbTable);

router.post("/", requireAuth, async (req: any, res: Response) => {
  const { fileId, preset } = req.body || {};
  if (!fileId || !preset) return res.status(400).json({ error: "fileId, preset required" });

  const qutUsername = req.user.email;
  const sub = req.user.sub;
  const item = await repo.get(qutUsername, fileId);
  if (!item) return res.status(404).json({ error: "Video not found" });
  if (item.ownerSub !== sub) return res.status(403).json({ error: "Forbidden" });

  const reso = preset === "480p" ? { w: 854, h: 480, name: "480p" as const } : { w: 1280, h: 720, name: "720p" as const };
  await repo.setStatus(qutUsername, fileId, "transcoding");
  
  console.log("#######1")
  const tmpDir = "/tmp";
  const inPath = path.join(tmpDir, `in_${fileId}.mp4`);
  const outPath = path.join(tmpDir, `out_${reso.name}_${fileId}.mp4`);
  
  
  console.log("#######2")
  // // Download original
  // const get = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: item.sourceKey }));
  // await streamToFile(get.Body as any, inPath);

  // Download  from S3 
  const get = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: item.sourceKey }));
  const bytes = await (get.Body as any).transformToByteArray?.()   
    ?? await new Promise<Uint8Array>((resolve, reject) => {        
        const chunks: Buffer[] = [];
        (get.Body as NodeJS.ReadableStream)
          .on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
          .on("end", () => resolve(Uint8Array.from(Buffer.concat(chunks))))
          .on("error", reject);
      });
  await fs.writeFile(inPath, Buffer.from(bytes));

  // sanity check
  const st = await fs.stat(inPath);
  if (st.size < 1024) { 
    throw new Error(`Downloaded object too small (${st.size} bytes). `);
  }

  console.log("#######3")
  // Transcode
  await transcode(inPath, outPath, `${reso.w}x${reso.h}`);
  console.log("#######4")
  // S3
  const variantKey = `users/${sub}/${fileId}/variant/${reso.name}.mp4`;
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: variantKey, Body: createReadStream(outPath), ContentType: "video/mp4" }));
  console.log("#######5")
  // dynamo
  const stat = await fs.stat(outPath);
  await repo.addVariant(qutUsername, fileId, { key: variantKey, resolution: reso.name, size: stat.size });
  await repo.setStatus(qutUsername, fileId, "ready");
  console.log("#######6")
  Promise.allSettled([fs.unlink(inPath), fs.unlink(outPath)]).catch(()=>{});
  res.json({ success: true, fileId, variantKey });
});

function streamToFile(stream: NodeJS.ReadableStream, filePath: string) {
  return new Promise<void>((resolve, reject) => {
    const ws = createWriteStream(filePath);
    stream.pipe(ws);
    ws.on("finish", resolve).on("error", reject);
  });
}
function transcode(src: string, dst: string, size: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(src)
      .videoCodec("libx264")
      .size(size)
      .outputOptions(["-preset veryfast", "-movflags +faststart"])
      .on("end", (_stdout: string | null, _stderr: string | null) => resolve())
      .on("error", (err: any) => reject(err))
      .save(dst);
  });
}


export default router;
