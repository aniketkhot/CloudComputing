import { ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { aws } from "./services/aws";
import { randomUUID } from "crypto";
import * as fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import * as path from "path";
import { spawn } from "child_process";
import { pipeline } from "stream/promises";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { addVariant, setStatus } from "./services/videoRepo";
ffmpeg.setFfmpegPath(ffmpegPath);

// async function runFfmpeg(inputPath: string, outputPath: string): Promise<void> {
//   // Adjust filters/presets as needed
//   const args = ["-y", "-i", inputPath, "-vf", "scale=-2:720", "-c:v", "libx264", "-preset", "veryfast", "-c:a", "aac", outputPath];
//   return new Promise((resolve, reject) => {
//     const p = spawn("ffmpeg", args, { stdio: ["ignore", "inherit", "inherit"] });
//     p.on("error", reject);
//     p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`))));
//   });
// }

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

async function processMessage(body: any) {
  const { s3 } = aws();
  const bucket = "cab432-n11672153-videos"
  console.log(body)
  const key = String(body.key);
  const videoId = key.split('/')[2];
  const qutUsername = String(body.qutUsername);
  const preset = String(body.outputPreset ?? "mp4-720p");
  const correlationId = body.correlationId || randomUUID();

  const workDir = "/tmp";
  const inFile = path.join(workDir, `in-${correlationId}.mov`);
  const outFile = path.join(workDir, `out-${correlationId}.mp4`);

  console.log(` Downloading: s3://${bucket}/${key}`);

  await setStatus("n11672153@qut.edu.au", videoId, "transcoding");
  
  const getResp = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!getResp.Body) throw new Error("GetObject returned empty Body");
  await pipeline(getResp.Body as NodeJS.ReadableStream, fs.createWriteStream(inFile));

  // await setStatus(qutUsername, key, "transcoding");

  
  
  // 2) Transcode with ffmpeg
  const reso = preset === "480p" ? { w: 854, h: 480, name: "480p" as const } : { w: 1280, h: 720, name: "720p" as const };
  console.log(`Transcoding (${preset}) ...`);
  await transcode(inFile, outFile, `${reso.w}x${reso.h}`);

  
  
  
  // 3) Upload to S3 
  const outputKey = key
    .replace(/^uploads\//, "outputs/")
    .replace(/\/original\//, "/outputs/") // 
    .replace(/\.[^/.]+$/, ".mp4");        // force .mp4
  console.log(` Uploading: s3://${bucket}/${outputKey}`);

  const bodyStream = fs.createReadStream(outFile);
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: outputKey, Body: bodyStream, ContentType: "video/mp4" }));

    await addVariant("n11672153@qut.edu.au", videoId, {
  preset,
  key: outputKey,
  createdAt: new Date().toISOString(),
});
await setStatus("n11672153@qut.edu.au", videoId, "ready");

  
// 4) Cleanup tmp files (best-effort)
  fs.rm(inFile, { force: true }, () => {});
  fs.rm(outFile, { force: true }, () => {});

  console.log(`Processed ${key} -> ${outputKey}`);
}

async function main() {
  
  const jobsQueueUrl = "https://sqs.ap-southeast-2.amazonaws.com/901444280953/n11672153-transcoder-queue"
  const { sqs } = aws();

  console.log("Worker started. Polling:", jobsQueueUrl);

  while (true) {
    try {
      const resp = await sqs.send(new ReceiveMessageCommand({
        QueueUrl: jobsQueueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
        VisibilityTimeout: 300
      }));

      if (!resp.Messages || resp.Messages.length === 0) continue;

      for (const msg of resp.Messages) {
        try {
          const body = JSON.parse(msg.Body || "{}");
          await processMessage(body);

          await sqs.send(new DeleteMessageCommand({
            QueueUrl: jobsQueueUrl,
            ReceiptHandle: msg.ReceiptHandle!
          }));
        } catch (e: any) {
          console.error("Process error (will be retried by SQS):", e?.message || e);
          
        }
      }
    } catch (e) {
      console.error("Poll error:", e);
      
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

