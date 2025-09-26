import "dotenv/config";
import { S3Client, CreateBucketCommand, PutBucketTaggingCommand, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getConfig } from "../config";

const {region} = getConfig() //process.env.AWS_REGION || "ap-southeast-2";
const {bucket} = getConfig() //process.env.S3_BUCKET || "cab432-n11672153-videos";
const {ddbTable}  = getConfig() // process.env.DDB_TABLE || "cab432-n11672153-videos";                      
const qutUsername = process.env.QUT_USERNAME || "n11672153@qut.edu.au";               
const purpose = "assessment-2";

async function main() {
  const s3 = new S3Client({ region });

  try { await s3.send(new CreateBucketCommand({ Bucket: bucket })); } catch {}
  await s3.send(new PutBucketTaggingCommand({
    Bucket: bucket,
    Tagging: { TagSet: [{ Key: "qut-username", Value: qutUsername }, { Key: "purpose", Value: purpose }] }
  }));

  const objectKey = "demo/hello.txt";
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: "Hello ther!" }));
  const get = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: objectKey }));
  console.log("Read:", await (get.Body as any).transformToString());

  const presigned = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: objectKey }), { expiresIn: 3600 });
  console.log("Presigned GET:", presigned);
}
main().catch(console.error);
