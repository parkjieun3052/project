import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, 'front-end'), '');
  const apiKey = env.VITE_PUBLIC_DATA_API_KEY || '';
  const apiKeyParam = env.VITE_PUBLIC_DATA_KEY_PARAM || 'serviceKey';
  const sourceMap = {
    national: env.VITE_PUBLIC_DATA_NATIONAL_URL || '',
    local: env.VITE_PUBLIC_DATA_LOCAL_URL || '',
    youth: env.VITE_PUBLIC_DATA_YOUTH_URL || ''
  };

  return {
    root: 'front-end',
    envDir: 'front-end',
    plugins: [
      {
        name: 'support-api-proxy',
        configureServer(server) {
          server.middlewares.use('/api/support', async (req, res) => {
            try {
              const requestUrl = new URL(req.url || '/', 'http://localhost');
              const source = requestUrl.searchParams.get('source') || '';
              const target = sourceMap[source];

              if (!target) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ error: '유효하지 않은 source 입니다. (national|local|youth)' }));
                return;
              }

              const targetUrl = new URL(target);
              if (apiKey) {
                targetUrl.searchParams.set(apiKeyParam, apiKey);
              }

              const upstream = await fetch(targetUrl.toString());
              const body = await upstream.text();

              res.statusCode = upstream.status;
              res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
              res.end(body);
            } catch (error) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                error: '프록시 요청 처리 중 오류가 발생했습니다.',
                detail: error instanceof Error ? error.message : 'unknown'
              }));
            }
          });
        }
      }
    ],
    build: {
      outDir: '../dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: 'index.html',
          search: 'search.html',
          support: 'support.html'
        }
      }
    }
  };
});
