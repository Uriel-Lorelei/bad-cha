const http = require('http');
const WebSocketServer = require('ws').Server;

const server = http.createServer((req, res) => {
    // For now, we'll just serve our HTML page if someone goes to the website's address
    if (req.url === '/') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        const fs = require('fs').promises;
        fs.readFile('index.html', 'utf8')
            .then(contents => {
                res.end(contents);
            })
            .catch(err => {
                res.writeHead(500);
                res.end('Error loading index.html');
            });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

const wss = new WebSocketServer({ server });

const clients = {}; // To store connected users
let nextClientId = 0;

wss.on('connection', ws => {
    const clientId = nextClientId++;
    clients[clientId] = ws;
    console.log(`Client connected: ${clientId}`);

    ws.on('message', message => {
        console.log(`Received message: ${message} from ${clientId}`);
        // When we get a message, send it to everyone else
        for (const client in clients) {
            if (parseInt(client) !== clientId && clients[client].readyState === 1) { // Check if client is not the sender and is open
                clients[client].send(message);
            }
        }
    });

    ws.on('close', () => {
        console.log(`Client disconnected: ${clientId}`);
        delete clients[clientId];
    });

    ws.on('error', error => {
        console.error(`WebSocket error for client ${clientId}: ${error}`);
        delete clients[clientId];
    });
});

const port = 3000;
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
