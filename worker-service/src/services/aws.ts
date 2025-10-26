import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SQSClient } from "@aws-sdk/client-sqs";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { fromInstanceMetadata } from "@aws-sdk/credential-providers";

let s3: S3Client;
let ddb: DynamoDBClient;
let ddbDoc: DynamoDBDocumentClient;
let sqs: SQSClient;

export function aws() {
  
      const region = "ap-southeast-2";
    let bucket = "cab432-n11672153-videos"
    let ddbTable = "cab432-n11672153-videos"
     const credentials = fromInstanceMetadata({ timeout: 2000, maxRetries: 2 });
  if (!s3) s3 = new S3Client({ region, credentials });
  if (!ddb) ddb = new DynamoDBClient({ region, credentials });
  if (!sqs) sqs = new SQSClient({ region, credentials });
      if (!ddbDoc) ddbDoc = DynamoDBDocumentClient.from(ddb, {
    marshallOptions: { removeUndefinedValues: true }
      });
  return { s3, ddb:ddbDoc, sqs };
}
