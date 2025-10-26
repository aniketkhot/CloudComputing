import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

import { aws } from "./aws";

export type Variant = {
  preset: string;
  key: string;
  sizeBytes?: number;
  createdAt: string;
};


const { ddb } = aws();
    const region = "ap-southeast-2";
    let bucket = "cab432-n11672153-videos"
    let ddbTable = "cab432-n11672153-videos"
    const tableName = ddbTable

export async function setStatus(
  qutUsername: "n11672153@qut.edu.au",
  videoId: string,
  status: "uploaded" | "transcoding" | "ready" | "failed"
) {
  await ddb.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { "qut-username": qutUsername, videoId },
      UpdateExpression: "SET #s = :s, updatedAt = :u",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":s": status,
        ":u": new Date().toISOString(),
      },
    })
  );
}

export async function addVariant(
  qutUsername: string,
  videoId: string,
  v: Variant
) {
  await ddb.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { "qut-username": qutUsername, videoId },
      UpdateExpression:
        "SET variants = list_append(if_not_exists(variants, :e), :v), updatedAt = :u",
      ExpressionAttributeValues: {
        ":e": [],
        ":v": [v],
        ":u": new Date().toISOString(),
      },
    })
  );
}
