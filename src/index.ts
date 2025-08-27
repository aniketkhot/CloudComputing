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
