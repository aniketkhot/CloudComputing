import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getConfig } from "../config";

const {region} = getConfig() //  process.env.AWS_REGION || "ap-southeast-2";
export const s3 = new S3Client({ region: region });
export const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: region }));

export async function presignPut(bucket: string, key: string, contentType: string) {
  return getSignedUrl(s3, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn: 900 });
}
export async function presignGet(bucket: string, key: string) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 900 });
}
