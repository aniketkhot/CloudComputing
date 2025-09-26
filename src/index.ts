import express from "express";
import fileUpload from "express-fileupload";
import path from "path";
import { initConfig } from "./config";   // <-- your config.ts
import { requireAuth } from "./services/jwt";

async function main() {
  
  await initConfig();

  
  const { default: authRoutes }       = await import("./routes/auth");
  const { default: filesRoutes }      = await import("./routes/files");
  const { default: transcodeRoutes }  = await import("./routes/transcode");
  

  
  const app = express();
  app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp" }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  
  const { uploadToAWS } = await import("./routes/files");
  app.post("/upload", requireAuth, async (req: any, res) => {
    try {
      const f0 = req.files?.file; const f = Array.isArray(f0) ? f0[0] : f0;
      if (!f) return res.status(400).json({ error: "file required (multipart 'file')" });
      const { videoId, key } = await uploadToAWS(req, f);
      res.json({ success: true, saved: videoId, key });
    } catch (e: any) { console.error("Upload error", e); res.status(500).json({ error: e.message }); }
  });

  app.use("/public", express.static(path.join(process.cwd(), "src", "public")));
  app.use("/api/auth", authRoutes);
  app.use("/api/files", filesRoutes);
  // app.use("/api/jobs", jobsRoutes);
  app.use("/api/transcode", transcodeRoutes);

  app.get("/health", (_req, res) => res.json({ ok: true }));
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => console.log(`Listening on ${PORT}`));
}

main().catch(err => { console.error("Fatal startup error:", err); process.exit(1); });
