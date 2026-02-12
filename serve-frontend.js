const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = __dirname; // serve files from the frontend folder

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/octet-stream'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  // Only handle GET and HEAD
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    return res.end('Method not allowed');
  }

  // Decode and strip querystring
  const decoded = decodeURIComponent(req.url.split('?')[0]);

  // Prevent path traversal and normalize
  let safePath = path.normalize(decoded).replace(/^([\\/]+)+/, '');
  if (safePath === '' || safePath === '.' || safePath === path.sep) {
    safePath = 'index.html';
  }

  const requestedPath = path.join(PUBLIC_DIR, safePath);

  // Ensure requestedPath is inside PUBLIC_DIR
  if (!requestedPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  fs.stat(requestedPath, (err, stats) => {
    if (err) {
      // If not found, return 404
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('Not found');
      }
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      console.error('File system error', err);
      return res.end('Server error');
    }

    // If directory, try to serve index.html inside it
    if (stats.isDirectory()) {
      const indexFile = path.join(requestedPath, 'index.html');
      fs.stat(indexFile, (iErr, iStats) => {
        if (iErr || !iStats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          return res.end('Not found');
        }
        streamFile(indexFile, res, req.method === 'HEAD');
      });
      return;
    }

    // Regular file
    if (stats.isFile()) {
      streamFile(requestedPath, res, req.method === 'HEAD');
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });
});

function streamFile(fullPath, res, isHead) {
  const mimeType = getMimeType(fullPath);
  res.writeHead(200, { 'Content-Type': mimeType });
  if (isHead) return res.end();
  const stream = fs.createReadStream(fullPath);
  stream.on('error', (err) => {
    console.error('Error streaming file', fullPath, err);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error');
  });
  stream.pipe(res);
}

server.listen(PORT, () => {
  console.log(`Static frontend server running at http://localhost:${PORT}/`);
  console.log(`Serving files from: ${PUBLIC_DIR}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => process.exit(0));
});
