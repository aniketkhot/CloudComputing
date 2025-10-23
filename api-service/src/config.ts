import { SSMClient, GetParametersCommand } from "@aws-sdk/client-ssm";

export type AppConfig = {
  region: string;
  bucket: string;
  ddbTable: string;
  jobsQueueUrl: string;
  qutUsername?: string;
};

let _config: AppConfig | null = null;

export async function initConfig(): Promise<AppConfig> {
  if (_config) return _config;

  const region = "ap-southeast-2";
  const ssm = new SSMClient({ region });

  const names = ["/n11672153/bucket-name", "/n11672153/ddm_table", "/n11672153/jobs_queue_url"];
  const { Parameters = [] } = await ssm.send(
    new GetParametersCommand({ Names: names, WithDecryption: false })
  );
  const map = Object.fromEntries(Parameters.map((p) => [p.Name!, p.Value!]));

  const bucket = process.env.BUCKET || map["/n11672153/bucket-name"];
  const ddbTable = process.env.DDB_TABLE || map["/n11672153/ddm_table"];
  const jobsQueueUrl = process.env.JOBS_QUEUE_URL || map["/n11672153/jobs_queue_url"];

  if (!bucket || !ddbTable) {
    throw new Error("Missing S3 bucket or DynamoDB table name (Parameter Store or env).");
  }
  if (!jobsQueueUrl) {
    throw new Error("Missing SQS Jobs Queue URL (set JOBS_QUEUE_URL env or SSM /n11672153/jobs_queue_url).");
  }

  _config = { region, bucket, ddbTable, jobsQueueUrl };
  return _config;
}

export function getConfig(): AppConfig {
  if (!_config) throw new Error("Config not initialised. Call initConfig() first.");
  return _config;
}
