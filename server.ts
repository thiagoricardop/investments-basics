import express, { type Request, type Response } from 'express';
import { Readable } from 'node:stream';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_RAW_BASE = 'https://raw.githubusercontent.com/thiagoricardop/investments-basics/main';

const ALLOWED_MEDIA_FILES = new Set([
  '01/How_Stock_Order_Books_Actually_Work.m4a',
  '01/Trading_Foundations.mp4',
  '02/Market_Realities_Blueprint.mp4',
  '02/You_Are_Buying_Products_Not_Assets.m4a',
  '03/The_Financial_Architect.mp4',
  '03/Why_SPY_Costs_Thousands_More_Than_VOO.m4a',
  '04/Short-Term_Trading__Lab_Test.mp4',
  '04/Why_High_Win_Rates_Bankrupt_Traders.m4a',
  '05/Algorithmic_Trading_Lab.mp4',
  '05/Why_Your_Backtest_Lies_to_You.m4a',
]);

async function handleMediaRequest(req: Request, res: Response) {
  const chapter = String(req.params.chapter || '');
  const filename = String(req.params.filename || '');
  const relPath = `${chapter}/${filename}`;

  if (!ALLOWED_MEDIA_FILES.has(relPath)) {
    res.status(404).json({ error: 'Media asset not found in repository' });
    return;
  }

  const upstreamUrl = `${REPO_RAW_BASE}/${relPath}`;
  const upstreamHeaders: Record<string, string> = {};
  if (typeof req.headers.range === 'string') {
    upstreamHeaders.Range = req.headers.range;
  }

  try {
    const upstream = await fetch(upstreamUrl, { headers: upstreamHeaders });
    if (!upstream.ok && upstream.status !== 206) {
      res.status(upstream.status).json({ error: 'Upstream media fetch failed' });
      return;
    }

    const contentType = filename.endsWith('.mp4') ? 'video/mp4' : 'audio/mp4';
    res.status(upstream.status);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const contentLength = upstream.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    const contentRange = upstream.headers.get('content-range');
    if (contentRange) res.setHeader('Content-Range', contentRange);

    if (req.method === 'HEAD' || !upstream.body) {
      res.end();
      return;
    }

    const nodeStream = Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]);
    nodeStream.on('error', () => {
      if (!res.headersSent) {
        res.status(502).end();
      } else {
        res.end();
      }
    });
    req.on('close', () => {
      nodeStream.destroy();
    });
    nodeStream.pipe(res);
  } catch (err) {
    console.error('[media-proxy] error:', err);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Unable to stream media from GitHub repository' });
    }
  }
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT || 3000);

  app.get('/api/media/:chapter/:filename', handleMediaRequest);
  app.head('/api/media/:chapter/:filename', handleMediaRequest);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Investments Basics server running at http://0.0.0.0:${port}`);
  });
}

startServer();
