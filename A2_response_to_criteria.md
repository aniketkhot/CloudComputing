=


Overview
------------------------------------------------

- **Name:** Aniket Khot
- **Student number:** N11672153
- **Partner name (if applicable):** *N/A*
- **Application name:** VideoTranscoder
- **Two line description:** A cloud-based video service where users upload videos, trigger CPU-intensive ffmpeg transcodes (720p/480p), and download originals or variants. Authentication is via AWS Cognito with JWT; data includes unstructured video files and structured metadata.
- **EC2 instance name or ID:** *[i-0c10667eced4f5623]*

------------------------------------------------

### Core - First data persistence service

- **AWS service name:** Amazon S3
- **What data is being stored?:** Original uploaded video files and transcoded outputs.
- **Why is this service suited to this data?:** S3 provides scalable, durable, and cost-effective storage for large unstructured objects like video files.
- **Why are the other services used not suitable for this data?:** DynamoDB is not designed for large binary files, and RDS would be inefficient and costly for storing large media blobs.
- **Bucket/instance/table name:** *[cab432-n11672153-videos]*
- **Video timestamp:** *[00:02]*
- **Relevant files:**
  - `/src/routes/files.ts`
  - `/src/index.ts`

### Core - Second data persistence service

- **AWS service name:** Amazon DynamoDB
- **What data is being stored?:** Metadata about files and jobs (owner, file name, size, job status, output paths).
- **Why is this service suited to this data?:** DynamoDB is highly available, low-latency, and ideal for structured key–value storage like job states and metadata.
- **Why are the other services used not suitable for this data?:** S3 cannot efficiently query structured metadata; RDS is unnecessary overhead for simple key–value lookups.
- **Bucket/instance/table name:** *[cab432-n11672153-videos]*
- **Video timestamp:** *[Insert]*
- **Relevant files:**
  - `/src/services/dynamo.ts`
  - `/src/routes/files.ts`
  - `/src/routes/transcode.ts`

### Third data service

- **AWS service name:** *Not implemented*
- **What data is being stored?:**  
- **Why is this service suited to this data?:**  
- **Why are the other services used not suitable for this data?:**  
- **Bucket/instance/table name:**  
- **Video timestamp:**  
- **Relevant files:**  

### S3 Pre-signed URLs

- **S3 Bucket names:** *[cab432-n11672153-videos]*
- **Video timestamp:** *[01:34]*
- **Relevant files:**
  - `/src/routes/files.ts`
  - `/src/services/aws.ts`
  - `/public/index.html`


### In-memory cache

- **ElastiCache instance name:** *Not implemented*
- **What data is being cached?:**  
- **Why is this data likely to be accessed frequently?:**  
- **Video timestamp:**  
- **Relevant files:**  

### Core - Statelessness

- **What data is stored within your application that is not stored in cloud data services?:** Temporary intermediate files during ffmpeg transcoding.
- **Why is this data not considered persistent state?:** They can be recreated from source videos if lost; final outputs are persisted in S3.
- **How does your application ensure data consistency if the app suddenly stops?:** DynamoDB stores the job state (`uploaded`, `transcoding`, `ready`,`failed` ), so unfinished jobs can be retried or resumed without corruption. Original files remain safe in S3.
- **Relevant files:**
  - `/src/services/ffmpeg.ts`
  - `/src/services/videoRepo.ts`

### Graceful handling of persistent connections

- **Type of persistent connection and use:** None implemented (stateless REST + S3 pre-signed uploads/downloads).
- **Method for handling lost connections:** Not applicable.
- **Relevant files:**
  - *N/A*

### Core - Authentication with Cognito

- **User pool name:** *[User pool - bt055]*
- **User pool Id:** *[ap-southeast-2_VBlfPVnT5]*
- **How are authentication tokens handled by the client?:** On login, Cognito issues a JWT which the client stores and attaches to `Authorization` headers for subsequent API requests.
- **Video timestamp:** *[03:55]*
- **Relevant files:**
  - `/src/routes/auth.ts`
  - `/src/services/jwt.ts`

### Cognito multi-factor authentication

- **What factors are used for authentication:** Not implemented.
- **Video timestamp:**  
- **Relevant files:**  

### Cognito federated identities

- **Identity providers used:** Not implemented.
- **Video timestamp:**  
- **Relevant files:**  

### Cognito groups

- **How are groups used to set permissions?:** Not implemented.
- **Video timestamp:**  
- **Relevant files:**  

### Core - DNS with Route53

- **Subdomain**: *[http://transformer.cab432.com:8080/public/index.html]*
- **Video timestamp:** *[05:02]*

### Parameter store

- **Parameter names:** e.g. `/n11672153/bucket-name`, `/n11672153/ddm_table`
- **Video timestamp:** *[05:55]*
- **Relevant files:**
  - `/src/config.ts`
  - `/routes/files.ts`

### Secrets manager

- **Secrets names:** e.g. `n11672153-congnito-details`
- **Video timestamp:** *[06:44]*
- **Relevant files:**
  - `/src/services/secrets.ts`
  - `/src/services/jwt.ts`

### Infrastructure as code

- **Technology used:** Not implemented.
- **Services deployed:**  
- **Video timestamp:**  
- **Relevant files:**  

### Other (with prior approval only)

- **Description:**  
- **Video timestamp:**  
- **Relevant files:**  

### Other (with prior permission only)

- **Description:**  
- **Video timestamp:**  
- **Relevant files:**       