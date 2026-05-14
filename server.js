const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const WEBHOOK_URL = 'https://bitautomationen.app.n8n.cloud/webhook-test/afcab86f-ef33-44ad-8d05-ce938c1c0441';

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {

    // ─── WEBHOOK PROXY ENDPOINT ───
    if (req.method === 'POST' && req.url === '/api/webhook') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            console.log('\n📨 Received form data on /api/webhook');
            console.log('   Data:', body.substring(0, 500));

            // Forward to n8n
            const webhookUrl = new URL(WEBHOOK_URL);
            const options = {
                hostname: webhookUrl.hostname,
                port: 443,
                path: webhookUrl.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body)
                }
            };

            const proxyReq = https.request(options, (proxyRes) => {
                let responseBody = '';
                proxyRes.on('data', chunk => responseBody += chunk);
                proxyRes.on('end', () => {
                    console.log('   ✅ n8n responded:', proxyRes.statusCode, responseBody.substring(0, 200));
                    res.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(JSON.stringify({ success: true, status: proxyRes.statusCode }));
                });
            });

            proxyReq.on('error', (err) => {
                console.error('   ❌ Error forwarding to n8n:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            });

            proxyReq.write(body);
            proxyReq.end();
        });
        return;
    }

    // ─── CORS PREFLIGHT ───
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    // ─── STATIC FILE SERVER ───
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log('');
    console.log('🚀 Drohne112 Form Server running!');
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Webhook: ${WEBHOOK_URL}`);
    console.log('');
    console.log('   Form submissions will be proxied to n8n (no CORS issues)');
    console.log('   Press Ctrl+C to stop');
    console.log('');
});
