import { ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { initConfig, getConfig } from "./config";
import { aws } from "./services/aws";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();
// If your ffmpeg helper exists at domain/ffmpeg.ts:
import * as path from "path";
import { spawn } from "child_process";
// Replace with your own abstraction if you already have one:
async function runFfmpeg(inputPath: string, outputPath: string, preset: string): Promise<void> {
  // Example: very simple mp4 transcode; adjust to your existing helper
  return new Promise((resolve, reject) => {
    const args = ["-y", "-i", inputPath, "-vf", "scale=-2:720", "-c:v", "libx264", "-preset", "veryfast", "-c:a", "aac", outputPath];
    const p = spawn("ffmpeg", args);
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`))));
  });
}

async function processMessage(body: any) {
  const { s3 } = aws();
  const { bucket } = getConfig();

  const key = body.key as string;
  const preset = (body.outputPreset as string) || "mp4-720p";
  const correlationId = body.correlationId || uuidv4();

  // 1) Download from S3 (you can stream to a tmp file)
  const inFile = `/tmp/in-${correlationId}`;
  const outFile = `/tmp/out-${correlationId}.mp4`;

  // Minimal streaming download example
  // For brevity: rely on aws s3 cp via child_process or implement GetObject stream:
  const { spawn } = await import("child_process");
  await new Promise<void>((resolve, reject) => {
    const cp = spawn("aws", ["s3", "cp", `s3://${bucket}/${key}`, inFile]);
    cp.on("error", reject);
    cp.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`aws s3 cp in exit ${code}`))));
  });

  // 2) Transcode
  await runFfmpeg(inFile, outFile, preset);

  // 3) Upload to S3 (output to a parallel folder, e.g., "outputs/")
  const outputKey = key.replace(/^uploads\//, "outputs/").replace(/\.[^/.]+$/, ".mp4");
  await new Promise<void>((resolve, reject) => {
    const up = spawn("aws", ["s3", "cp", outFile, `s3://${bucket}/${outputKey}`]);
    up.on("error", reject);
    up.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`aws s3 cp out exit ${code}`))));
  });

  // 4) (Optional) Update DynamoDB status via your videosRepo if you moved it here.
  // TODO: call your videosRepo.updateStatus(correlationId, "COMPLETED", { outputKey });

  console.log(`Processed ${key} -> ${outputKey}`);
}

async function main() {
  await initConfig();
  const { jobsQueueUrl } = getConfig();
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

      if (!resp.Messages || resp.Messages.length === 0) {
        continue;
      }

      for (const msg of resp.Messages) {
        try {
          const body = JSON.parse(msg.Body || "{}");
          await processMessage(body);

          await sqs.send(new DeleteMessageCommand({
            QueueUrl: jobsQueueUrl,
            ReceiptHandle: msg.ReceiptHandle!
          }));
        } catch (e) {
          console.error("Process error (will be retried by SQS):", e);
          // Do not delete message => SQS will retry; after maxReceive it goes to DLQ if configured
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
