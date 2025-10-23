import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SQSClient } from "@aws-sdk/client-sqs";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getConfig } from "../config";

let _s3: S3Client;
let _ddb: DynamoDBClient;
let _sqs: SQSClient;

function ensure() {
  const { region } = getConfig();
  if (!_s3) _s3 = new S3Client({ region });
  if (!_ddb) _ddb = new DynamoDBClient({ region });
  if (!_sqs) _sqs = new SQSClient({ region });
}

/** Compatibility helper */
export function aws() {
  ensure();
  return { s3: _s3, ddb: _ddb, sqs: _sqs };
}

export function s3(): S3Client {
  ensure();
  return _s3;
}
export function ddb(): DynamoDBClient {
  ensure();
  return _ddb;
}
export function sqs(): SQSClient {
  ensure();
  return _sqs;
}

/** presigners matching existing call sites */
export async function presignPut(
  bucket: string,
  key: string,
  contentType?: string,
  expiresIn = 900
) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3(), command, { expiresIn });
}

export async function presignGet(bucket: string, key: string, expiresIn = 900) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3(), command, { expiresIn });
}
