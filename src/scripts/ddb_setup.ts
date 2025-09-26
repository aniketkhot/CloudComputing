import "dotenv/config";
import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";

const region = process.env.AWS_REGION || "ap-southeast-2";
const table  = process.env.DDB_TABLE || "cab432-n11672153-videos";                       // e.g., cab432-n11672153-videos

async function main() {
  const client = new DynamoDBClient({ region });
  try {
    await client.send(new CreateTableCommand({
      TableName: table,
      AttributeDefinitions: [
        { AttributeName: "qut-username", AttributeType: "S" },
        { AttributeName: "videoId", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "qut-username", KeyType: "HASH" },
        { AttributeName: "videoId", KeyType: "RANGE" },
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
    }));
    console.log("#######Table creating…");
  } catch (e) {
    console.log("CreateTable skipped/failed:", (e as any)?.name);
  }
}
main().catch(console.error);
