import { Router, Request, Response } from "express";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { aws } from "../services/aws";
import { getConfig } from "../config";
import { v4 as uuidv4 } from "uuid";

// You can reuse your JWT middleware here if needed
const router = Router();

/**
 * POST /transcode/submit
 * Body: { key: string, outputPreset?: string }
 * Behavior: enqueues a transcode job to SQS. Worker will process.
 */
router.post("/submit", async (req: Request, res: Response) => {
  try {
    const { key, outputPreset = "mp4-720p" } = req.body || {};
    if (!key) return res.status(400).json({ error: "Missing 'key' (S3 object key)" });

    const { jobsQueueUrl, bucket } = getConfig();
    const { sqs } = aws();

    const correlationId = uuidv4();
    const message = {
      version: 1,
      correlationId,
      bucket,
      key,
      outputPreset,
      requestedAt: new Date().toISOString()
    };

    await sqs.send(new SendMessageCommand({
      QueueUrl: jobsQueueUrl,
      MessageBody: JSON.stringify(message)
    }));

    return res.status(202).json({ status: "queued", correlationId });
} catch (err: any) {
  console.error("enqueue error:", err?.name, err?.message, err?.$metadata || err);
  return res.status(500).json({ error: "Failed to enqueue job" });
}

});

export default router;
