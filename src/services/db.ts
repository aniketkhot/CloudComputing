// import fs from 'fs';
// import path from 'path';

// const DATA_DIR = path.join(__dirname, '..', 'data');
// const DB_PATH = path.join(DATA_DIR, 'db.json');
// if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
// if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({ files: [], jobs: [] }, null, 2));

// export type FileRec = { id: string; owner: string; originalName: string; storedPath: string; size: number; createdAt: number; };
// export type JobRec  = { id: string; owner: string; fileId: string; preset: string; status: string; startedAt?: number; finishedAt?: number; outputPath?: string; logs?: string; };

// function read(){ return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
// // following line is taken from ChatGPT or some part of it
// function write(d:any){ fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2)); }

// export const db = {
//   insertFile(f: FileRec) {
//     const d = read();
//     d.files.push(f);
//     write(d);
//     return f;
//   },
//   getFile(id: string) {
//     return read().files.find((x: FileRec) => x.id === id) as
//       | FileRec
//       | undefined;
//   },
//   listFilesByOwner(owner: string) {
//     return read().files.filter((x: FileRec) => x.owner === owner) as FileRec[];
//   },
//   insertJob(j: JobRec) {
//     const d = read();
//     d.jobs.push(j);
//     write(d);
//     return j;
//   },
//   updateJob(id: string, patch: Partial<JobRec>) {
//     const d = read();
//     const j = d.jobs.find((x: JobRec) => x.id === id);
//     if (j) Object.assign(j, patch);
//     write(d);
//     return j;
//   },
//   getJob(id: string) {
//     return read().jobs.find((x: JobRec) => x.id === id) as JobRec | undefined;
//   },
//   paths: { DATA_DIR, DB_PATH },
// };
