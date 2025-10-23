import { SSMClient, GetParametersCommand } from "@aws-sdk/client-ssm";

export type AppConfig = {
  region: string;
  bucket: string;
  ddbTable: string;
  qutUsername?: string; 
};

let _config: AppConfig | null = null;

export async function initConfig(): Promise<AppConfig> {
  if (_config) return _config;

  const region = "ap-southeast-2";
  const ssm = new SSMClient({ region });


  const Names = ["/n11672153/bucket-name", "/n11672153/ddm_table"];
  const { Parameters = [] } = await ssm.send(new GetParametersCommand({ Names, WithDecryption: false }));
  const map = Object.fromEntries(Parameters.map(p => [p.Name!, p.Value!]));

  
  const bucket   =  map["/n11672153/bucket-name"];
  const ddbTable =  map["/n11672153/ddm_table"];

  if (!bucket || !ddbTable) {
    throw new Error("Missing S3 bucket or DynamoDB table.");
  }

  _config = { region, bucket, ddbTable };
  return _config;
}

export function getConfig(): AppConfig {
  if (!_config) throw new Error("config not initialised");
  return _config;
}
