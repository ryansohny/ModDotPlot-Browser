import { defineConfig } from "vite";
import packageMetadata from "./package.json" with { type: "json" };

export default defineConfig({
  base: process.env.MODDOTPLOT_BASE_PATH ?? "/",
  define: {
    __APP_VERSION__: JSON.stringify(packageMetadata.version),
  },
  plugins: [{
    // The preview server labels *.gz as `Content-Encoding: gzip`, so browsers decode it
    // and stop after the first BGZF block. Serve .gz bytes as-is for remote FASTA/tracks.
    name: "serve-gz-as-is",
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (/\.gz$/i.test((req.url ?? "").split("?")[0] ?? "")) {
          const writeHead = res.writeHead.bind(res) as (code: number, headers?: Record<string, unknown>) => typeof res;
          res.writeHead = ((code: number, headers?: Record<string, unknown>) => {
            if (headers) delete headers["Content-Encoding"];
            res.removeHeader("Content-Encoding");
            return writeHead(code, headers);
          }) as typeof res.writeHead;
        }
        next();
      });
    },
  }],
});
