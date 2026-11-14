import {
  createServer,
  defineConfig,
  loadEnv,
  type Plugin,
  type ViteDevServer,
} from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";

type VercelHandler = (req: any, res: any) => Promise<void> | void;
type ModuleLoader = (id: string) => Promise<Record<string, any>>;

async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  loadModule: ModuleLoader
): Promise<boolean> {
  const rawUrl = req.url ?? "";
  if (!rawUrl.startsWith("/api/")) {
    return false;
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
      mod = await loadModule("/api/content.ts");
    } else if (pathname === "/api/admin/login") {
      mod = await loadModule("/api/admin/login.ts");
    } else if (pathname === "/api/admin/logout") {
      mod = await loadModule("/api/admin/logout.ts");
    } else if (pathname === "/api/admin/session") {
      mod = await loadModule("/api/admin/session.ts");
    } else if (pathname === "/api/admin/content") {
      mod = await loadModule("/api/admin/content.ts");
    } else {
      const viewMatch = pathname.match(/^\/api\/videos\/(\d+)\/view$/);
      if (viewMatch) {
        query.id = viewMatch[1];
        mod = await loadModule("/api/videos/[id]/view.ts");
      }
    }

    const handler = mod?.default as VercelHandler | undefined;
    if (!handler) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "API route not found." }));
      return true;
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

  return true;
}

function localApiMiddleware(): Plugin {
  return {
    name: "empower-local-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handleApiRequest(req, res, (id) =>
          server.ssrLoadModule(id)
        );
        if (!handled) next();
      });
    },
    configurePreviewServer(server) {
      let ssrServerPromise: Promise<ViteDevServer> | null = null;
      const getSsrServer = () => {
        if (!ssrServerPromise) {
          ssrServerPromise = createServer({
            appType: "custom",
            server: { middlewareMode: true },
            optimizeDeps: { noDiscovery: true },
          });
        }
        return ssrServerPromise;
      };

      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url ?? "";
        if (!rawUrl.startsWith("/api/")) {
          next();
          return;
        }
        const ssrServer = await getSsrServer();
        await handleApiRequest(req, res, (id) => ssrServer.ssrLoadModule(id));
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return {
    plugins: [react(), localApiMiddleware()],
  };
});
