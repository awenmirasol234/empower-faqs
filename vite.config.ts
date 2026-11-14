import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";

type VercelHandler = (req: any, res: any) => Promise<void> | void;

function localApiMiddleware(): Plugin {
  return {
    name: "empower-local-api",
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const rawUrl = req.url ?? "";
        if (!rawUrl.startsWith("/api/")) {
          next();
          return;
        }

        const url = new URL(rawUrl, "http://localhost");
        const pathname = url.pathname;
        const query: Record<string, string> = {};
        url.searchParams.forEach((value, key) => {
          query[key] = value;
        });

        try {
          let mod: Record<string, any> | null = null;

          if (pathname === "/api/content") {
            mod = await server.ssrLoadModule("/api/content.ts");
          } else if (pathname === "/api/admin/login") {
            mod = await server.ssrLoadModule("/api/admin/login.ts");
          } else if (pathname === "/api/admin/logout") {
            mod = await server.ssrLoadModule("/api/admin/logout.ts");
          } else if (pathname === "/api/admin/session") {
            mod = await server.ssrLoadModule("/api/admin/session.ts");
          } else if (pathname === "/api/admin/content") {
            mod = await server.ssrLoadModule("/api/admin/content.ts");
          } else {
            const viewMatch = pathname.match(/^\/api\/videos\/(\d+)\/view$/);
            if (viewMatch) {
              query.id = viewMatch[1];
              mod = await server.ssrLoadModule("/api/videos/[id]/view.ts");
            }
          }

          const handler = mod?.default as VercelHandler | undefined;
          if (!handler) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "API route not found." }));
            return;
          }

          const vercelReq = Object.assign(req, { query });
          await handler(vercelReq, res);
        } catch (err) {
          console.error("[local-api] error:", err);
          if (!res.writableEnded) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: err instanceof Error ? err.message : "Internal server error",
              })
            );
          }
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localApiMiddleware()],
});
