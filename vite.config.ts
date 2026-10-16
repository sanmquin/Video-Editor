import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

function apiFunctionsMiddlewarePlugin(): Plugin {
  const createMiddleware = (loadModule: (path: string) => Promise<any>) => {
    return async (req: any, res: any, next: () => void) => {
      if (!req.url) return next();

      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      let functionName = '';

      if (urlObj.pathname.startsWith('/api/')) {
        functionName = urlObj.pathname.replace(/^\/api\//, '');
      } else if (urlObj.pathname.startsWith('/.netlify/functions/')) {
        functionName = urlObj.pathname.replace(/^\/\.netlify\/functions\//, '');
      }

      if (!functionName) return next();

      let scriptPath = '';
      if (functionName === 'youtube-analytics') {
        scriptPath = './netlify/functions/youtube-analytics.ts';
      } else if (functionName === 'find-hooks') {
        scriptPath = './netlify/functions/find-hooks.ts';
      }

      if (scriptPath) {
        try {
          const queryParams: Record<string, string> = {};
          urlObj.searchParams.forEach((val, key) => {
            queryParams[key] = val;
          });

          let rawBody: string | null = null;
          if (req.method === 'POST' || req.method === 'PUT') {
            rawBody = await new Promise<string>((resolve) => {
              let body = '';
              req.on('data', (chunk: string) => body += chunk);
              req.on('end', () => resolve(body));
            });
          }

          const funcModule = await loadModule(scriptPath);
          const handler = funcModule.handler;

          const event = {
            httpMethod: req.method || 'GET',
            headers: req.headers as Record<string, string>,
            queryStringParameters: queryParams,
            body: rawBody,
          };

          const result = await handler(event, {} as any);

          res.statusCode = result.statusCode || 200;
          if (result.headers) {
            Object.entries(result.headers).forEach(([key, val]) => {
              if (val !== undefined) {
                res.setHeader(key, String(val));
              }
            });
          }
          res.end(result.body);
          return;
        } catch (err) {
          console.error(`Error executing API function (${functionName}) middleware:`, err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err) }));
          return;
        }
      }

      next();
    };
  };

  return {
    name: 'api-functions-middleware',
    configureServer(server) {
      server.middlewares.use(createMiddleware(path => server.ssrLoadModule(path)));
    },
    configurePreviewServer(server) {
      server.middlewares.use(createMiddleware(path => import(path)));
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiFunctionsMiddlewarePlugin()],
})
