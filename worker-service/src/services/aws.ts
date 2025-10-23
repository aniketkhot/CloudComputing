import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SQSClient } from "@aws-sdk/client-sqs";
import { getConfig } from "../config";

let s3: S3Client;
let ddb: DynamoDBClient;
let sqs: SQSClient;

export function aws() {
  const { region } = getConfig();
  if (!s3) s3 = new S3Client({ region });
  if (!ddb) ddb = new DynamoDBClient({ region });
  if (!sqs) sqs = new SQSClient({ region });
  return { s3, ddb, sqs };
}
