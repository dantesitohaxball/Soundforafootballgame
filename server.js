const http = require("http");
const { WebSocketServer } = require("ws");

const SECRET = process.env.SFX_TOKEN || "cambiar_esto";
const PORT   = process.env.PORT || 3000;

const CORS_HEADERS = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-sfx-secret",
};

const httpServer = http.createServer((req, res) => {

    if (req.method === "OPTIONS") {
        res.writeHead(204, CORS_HEADERS);
        res.end();
        return;
    }

    if (req.method === "POST" && req.url === "/sfx") {
        if (req.headers["x-sfx-secret"] !== SECRET) {
            res.writeHead(401, CORS_HEADERS);
            res.end("Unauthorized");
            return;
        }

        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            try {
                const data = JSON.parse(body);
                let enviados = 0;
                sfxClients.forEach(client => {
                    if (client.readyState === 1) {
                        client.send(JSON.stringify(data));
                        enviados++;
                    }
                });
                console.log(`[SFX] Evento "${data.tipo}" enviado a ${enviados} cliente(s)`);
                res.writeHead(200, CORS_HEADERS);
                res.end("OK");
            } catch (e) {
                res.writeHead(400, CORS_HEADERS);
                res.end("Bad JSON");
            }
        });
        return;
    }

    if (req.method === "POST" && req.url === "/positions") {
        if (req.headers["x-sfx-secret"] !== SECRET) {
            res.writeHead(401, CORS_HEADERS);
            res.end("Unauthorized");
            return;
        }

        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            try {
                const data = JSON.parse(body);
                posClients.forEach(client => {
                    if (client.readyState === 1) {
                        client.send(JSON.stringify(data));
                    }
                });
                res.writeHead(200, CORS_HEADERS);
                res.end("OK");
            } catch (e) {
                res.writeHead(400, CORS_HEADERS);
                res.end("Bad JSON");
            }
        });
        return;
    }

    res.writeHead(200, CORS_HEADERS);
    res.end("HaxBall SFX Server OK");
});

// ─── Dos WebSocketServers separados ──────────────────────────────────────────
const sfxClients = new Set();
const posClients = new Set();

const wss = new WebSocketServer({ noServer: true });
const wssPos = new WebSocketServer({ noServer: true });

wss.on("connection", (ws) => {
    sfxClients.add(ws);
    console.log(`[SFX WS] Cliente conectado. Total: ${sfxClients.size}`);
    ws.on("close", () => {
        sfxClients.delete(ws);
        console.log(`[SFX WS] Cliente desconectado. Total: ${sfxClients.size}`);
    });
});

wssPos.on("connection", (ws) => {
    posClients.add(ws);
    console.log(`[POS WS] Cliente conectado. Total: ${posClients.size}`);
    ws.on("close", () => {
        posClients.delete(ws);
        console.log(`[POS WS] Cliente desconectado. Total: ${posClients.size}`);
    });
});

// Separar conexiones por path
httpServer.on("upgrade", (req, socket, head) => {
    if (req.url === "/positions") {
        wssPos.handleUpgrade(req, socket, head, (ws) => {
            wssPos.emit("connection", ws, req);
        });
    } else {
        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, req);
        });
    }
});

httpServer.listen(PORT, () => {
    console.log(`[SFX Server] Corriendo en puerto ${PORT}`);
});
