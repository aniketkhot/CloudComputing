import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

export type Variant = { key: string; resolution: "720p" | "480p"; size?: number; durationSec?: number };


export type VideoItem = {
  "qut-username": string;
  videoId: string;
  ownerSub: string;
  status: "uploaded" | "transcoding" | "ready" | "failed";
  bucket: string;
  sourceKey: string;
  variants?: Variant[];
  createdAt: string;
  updatedAt: string;
};

export function videosRepo(ddb: DynamoDBDocumentClient, tableName: string) {
  return {
    async put(item: VideoItem) {
      const now = new Date().toISOString();
      item.createdAt ||= now; item.updatedAt = now;
      await ddb.send(new PutCommand({ TableName: tableName, Item: item }));
      return item;
    },
    async get(qutUsername: string, videoId: string) {
      const { Item } = await ddb.send(new GetCommand({ TableName: tableName, Key: { "qut-username": qutUsername, videoId } }));
      return Item as VideoItem | undefined;
    },
    async listMine(qutUsername: string) {
      const out = await ddb.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "#u = :u",
        ExpressionAttributeNames: { "#u": "qut-username" },
        ExpressionAttributeValues: { ":u": qutUsername }
      }));
      return (out.Items as VideoItem[] | undefined) || [];
    },
    async setStatus(qutUsername: string, videoId: string, status: VideoItem["status"]) {
      await ddb.send(new UpdateCommand({
        TableName: tableName,
        Key: { "qut-username": qutUsername, videoId },
        UpdateExpression: "SET #s = :s, updatedAt = :u",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": status, ":u": new Date().toISOString() }
      }));
    },
async addVariant(qutUsername: string, videoId: string, v: Variant) {
  await ddb.send(new UpdateCommand({
    TableName: tableName,
    Key: { "qut-username": qutUsername, videoId },
    UpdateExpression: "SET variants = list_append(if_not_exists(variants, :e), :v), updatedAt = :u",
    ExpressionAttributeValues: { ":e": [], ":v": [v], ":u": new Date().toISOString() }
  }));
}
  };
}
