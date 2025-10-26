import { Router, Request, Response } from "express";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { aws } from "../services/aws";
import { getConfig } from "../config";
import { v4 as uuidv4 } from "uuid";
import { videosRepo } from "../services/videosRepo";
import { ddb, presignGet, presignPut, s3 } from "../services/aws";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
// You can reuse your JWT middleware here if needed
const router = Router();


router.post("/", async (req: Request, res: Response) => {
  try {
    console.log(req)
    const {qutUsername, key, outputPreset = "mp4-720p" } = req.body || {};
    if (!key) return res.status(400).json({ error: "Missing 'key' (S3 object key)" });

    const { jobsQueueUrl, bucket } = getConfig();
    const { sqs } = aws();

    const correlationId = uuidv4();
    const message = {
      version: 1,
      correlationId,
      bucket,
      key,
      qutUsername,
      outputPreset,
      requestedAt: new Date().toISOString()
    };
    console.log(message)
        async function diag() {
      
      const sts = new STSClient("ap-southeast-2");
      const ident = await sts.send(new GetCallerIdentityCommand({}));
      
      
      
      console.log("[diag] bucket:", bucket);
      console.log("[diag] caller:", ident?.Arn);
    }
    await diag()
      

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
