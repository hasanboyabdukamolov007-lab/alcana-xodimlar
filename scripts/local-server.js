#!/usr/bin/env node
/**
 * Local static + API server (Vercel-like routes) for development and smoke tests.
 * Usage: npm run dev
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const root = path.join(__dirname, '..');
const port = Number(process.env.PORT || 8080);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function loadHandler(relPath) {
  const abs = path.join(root, relPath);
  delete require.cache[require.resolve(abs)];
  return require(abs);
}

function matchRoute(pathname) {
  if (pathname === '/api/health') {
    return { handler: loadHandler('api/health.js'), query: {} };
  }

  let m = pathname.match(/^\/api\/employees\/?$/);
  if (m) {
    return { handler: loadHandler('api/employees/index.js'), query: {} };
  }

  m = pathname.match(/^\/api\/employees\/([^/]+)\/docs\/([^/]+)\/?$/);
  if (m) {
    return {
      handler: loadHandler('api/employees/[id]/docs/[docId].js'),
      query: { id: decodeURIComponent(m[1]), docId: decodeURIComponent(m[2]) },
    };
  }

  m = pathname.match(/^\/api\/employees\/([^/]+)\/photo\/?$/);
  if (m) {
    return {
      handler: loadHandler('api/employees/[id]/photo.js'),
      query: { id: decodeURIComponent(m[1]) },
    };
  }

  m = pathname.match(/^\/api\/employees\/([^/]+)\/?$/);
  if (m) {
    return {
      handler: loadHandler('api/employees/[id].js'),
      query: { id: decodeURIComponent(m[1]) },
    };
  }

  m = pathname.match(/^\/api\/files\/([^/]+)\/([^/]+)\/?$/);
  if (m) {
    return {
      handler: loadHandler('api/files/[employeeId]/[docId].js'),
      query: {
        employeeId: decodeURIComponent(m[1]),
        docId: decodeURIComponent(m[2]),
      },
    };
  }

  return null;
}

function serveStatic(req, res, pathname) {
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.normalize(filePath).replace(/^(\.\.[/\\])+/, '');
  const abs = path.join(root, filePath);
  if (!abs.startsWith(root) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }
  const ext = path.extname(abs).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(abs).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const route = matchRoute(url.pathname);
    if (route) {
      req.query = { ...Object.fromEntries(url.searchParams), ...route.query };
      await route.handler(req, res);
      return;
    }
    serveStatic(req, res, url.pathname);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Server error' }));
    }
  }
});

fs.mkdirSync(path.join(root, 'data'), { recursive: true });

server.listen(port, '127.0.0.1', () => {
  console.log(`Alcana local server: http://127.0.0.1:${port}`);
  console.log(`API health: http://127.0.0.1:${port}/api/health`);
});
