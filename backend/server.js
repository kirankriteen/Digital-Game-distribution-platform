const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3000;

const users = {
    "testuser": hashPassword("password123")
};

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Server HTML Pages
function serveFile(res, filePath, contentType) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end("Not Found");
            return;
        }
        res.writeHead(200, {"Content-Type": contentType});
        res.end(data);
    });
}

// Create HTTP Server
const server = http.createServer((req, res) => {
    if(req.method === "GET") {
        if(req.url === '/') {
            serveFile(res, path.join(__dirname, 'index.html'), 'text/html');
        } else if(req.url === '/script.js') {
            serveFile(res, path.join(__dirname, 'script.js'), 'application/javascript');
        } else {
            res.writeHead(404);
            res.end("Not Found");
        }
    } else if(req.method === "POST" && req.url === '/login') {
        let body = '';
        req.on('data', chuck => body += chuck);
        req.on('end', () => {
            const params = new URLSearchParams(body);
            const username = params.get('username');
            const password = params.get('password');

            if(users[username] && users[username] === hashPassword(password)) {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Login successful!');
            } else {
                res.writeHead(401, { 'Content-Type': 'text/plain' });
                res.end('Invalid credentials');
            }
        });
    } else {
        res.writeHead(405);
        res.end('Method Not Allowed');
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});