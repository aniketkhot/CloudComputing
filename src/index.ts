import express from 'express';
import fileUpload from 'express-fileupload';
import path from 'path';
import authRoutes from './routes/auth';
import filesRoutes from './routes/files';
import jobsRoutes from './routes/jobs';
import transcodeRoutes from './routes/transcode';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(fileUpload({ createParentPath: true })); 
// app.use('/public', express.static(path.join(__dirname, 'public')));// for windows
app.use('/public', express.static(path.join(process.cwd(), 'src', 'public')));// ubuntu

app.use('/api/auth', authRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/transcode', transcodeRoutes);

app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));


//aws ec2 run-instances --image-id "ami-0279a86684f669718" --instance-type "t3.small" --instance-initiated-shutdown-behavior "terminate" --key-name "Aniket" --block-device-mappings '{"DeviceName":"/dev/sda1","Ebs":{"Encrypted":true,"DeleteOnTermination":true,"Iops":3000,"KmsKeyId":"arn:aws:kms:ap-southeast-2:901444280953:key/b0101809-9917-4e03-be5e-a357200ae578","SnapshotId":"snap-0341c3eaf0b93a377","VolumeSize":8,"VolumeType":"gp3","Throughput":125}}' --network-interfaces '{"SubnetId":"subnet-05a3b8177138c8b14","AssociatePublicIpAddress":true,"DeviceIndex":0,"Groups":["sg-032bd1ff8cf77dbb9"]}' --credit-specification '{"CpuCredits":"unlimited"}' --tag-specifications '{"ResourceType":"instance","Tags":[{"Key":"Name","Value":"n11672153_t3small"},{"Key":"qut-username","Value":"n11672153@qut.edu.au"},{"Key":"purpose","Value":"assignment-1"}]}' --iam-instance-profile '{"Arn":"arn:aws:iam::901444280953:instance-profile/CAB432-Instance-Role"}' --metadata-options '{"HttpEndpoint":"enabled","HttpPutResponseHopLimit":2,"HttpTokens":"required"}' --private-dns-name-options '{"HostnameType":"ip-name","EnableResourceNameDnsARecord":false,"EnableResourceNameDnsAAAARecord":false}' --count "1" 