import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { app } from "./src/backend/app.ts";

const PORT = 3000;

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static files serving from /dist folder.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`JantaMitra-AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
