import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

function netlifyFunctionsPlugin(): Plugin {
  return {
    name: 'netlify-functions-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/.netlify/functions/youtube-analytics')) {
          try {
            const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const queryParams: Record<string, string> = {};
            urlObj.searchParams.forEach((val, key) => {
              queryParams[key] = val;
            });

            // Dynamically import the netlify function handler
            const funcModule = await server.ssrLoadModule('/netlify/functions/youtube-analytics.ts');
            const handler = funcModule.handler;

            const event = {
              httpMethod: req.method || 'GET',
              headers: req.headers as Record<string, string>,
              queryStringParameters: queryParams,
              body: null,
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
            console.error('Error executing netlify function dev middleware:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
            return;
          }
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), netlifyFunctionsPlugin()],
})
