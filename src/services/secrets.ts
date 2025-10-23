import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const secretName = "n11672153-congnito-details";
const client = new SecretsManagerClient({
  region: "ap-southeast-2",
});


export interface CognitoSecret {
  "pool-id": string;
  "client-id": string;
  "client-secret": string;
}
let cachedSecret: CognitoSecret | null = null;

export async function getCognitoSecret(): Promise<CognitoSecret> {
  if (cachedSecret) return cachedSecret;

  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: secretName,
    })
  );

  if (!response.SecretString) {
    throw new Error("SecretString not found in res");
  }
  console.log()
  const parsed = JSON.parse(response.SecretString) as CognitoSecret;
  console.log("secret from aws", parsed)
  cachedSecret = parsed;
  return parsed;
}
