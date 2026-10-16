import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.vtt': 'text/vtt; charset=utf-8',
};

async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  const server = http.createServer(async (req, res) => {
    try {
      const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const pathname = urlObj.pathname;

      let functionName = '';
      if (pathname.startsWith('/api/')) {
        functionName = pathname.replace(/^\/api\//, '');
      } else if (pathname.startsWith('/.netlify/functions/')) {
        functionName = pathname.replace(/^\/\.netlify\/functions\//, '');
      }

      if (functionName) {
        let scriptPath = '';
        if (functionName === 'youtube-analytics') {
          scriptPath = '/netlify/functions/youtube-analytics.ts';
        } else if (functionName === 'find-hooks') {
          scriptPath = '/netlify/functions/find-hooks.ts';
        }

        if (scriptPath) {
          try {
            const queryParams = {};
            urlObj.searchParams.forEach((val, key) => {
              queryParams[key] = val;
            });

            let rawBody = null;
            if (req.method === 'POST' || req.method === 'PUT') {
              rawBody = await new Promise((resolve) => {
                let body = '';
                req.on('data', (chunk) => body += chunk);
                req.on('end', () => resolve(body));
              });
            }

            const funcModule = await vite.ssrLoadModule(scriptPath);
            const handler = funcModule.handler;

            const event = {
              httpMethod: req.method || 'GET',
              headers: req.headers,
              queryStringParameters: queryParams,
              body: rawBody,
            };

            const result = await handler(event, {});

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
            console.error(`API Function Error (${functionName}):`, err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
            return;
          }
        }
      }

      // Serve static assets from dist/ if built, otherwise serve index.html
      let filePath = path.join(DIST_DIR, pathname);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (!fs.existsSync(filePath)) {
        filePath = path.join(DIST_DIR, 'index.html');
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        fs.createReadStream(filePath).pipe(res);
        return;
      }

      res.statusCode = 404;
      res.end('Not Found');
    } catch (err) {
      console.error('Server error:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  server.listen(PORT, () => {
    console.log(`🚀 Standalone server running at http://localhost:${PORT}`);
  });
}

startServer();
