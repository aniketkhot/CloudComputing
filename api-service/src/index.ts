import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import { initConfig } from "./config";
import { requireAuth } from "./services/jwt";
import path from "path";



async function main() {
  await initConfig(); // important

  
  const auth = (await import("./routes/auth")).default;
  const files = (await import("./routes/files")).default;
  const transcode = (await import("./routes/transcode")).default;

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(morgan("dev"));


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

  app.use("/auth", auth);
  app.use("/files", files);
  app.use("/transcode", transcode);
  app.get("/", (_, res) => res.send("API Service is running ✅"));

  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`API listening on ${port}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
