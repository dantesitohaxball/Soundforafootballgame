const http = require("http");
const { WebSocketServer } = require("ws");

const SECRET = process.env.SFX_SECRET || "cambiar_esto";
const PORT   = process.env.PORT || 3000;

const CORS_HEADERS = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-sfx-secret",
};

const httpServer = http.createServer((req, res) => {

    // Preflight CORS
    if (req.method === "OPTIONS") {
        res.writeHead(204, CORS_HEADERS);
        res.end();
        return;
    }

    if (req.method === "POST" && req.url === "/sfx") {
        // Verificar token secreto
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
                wss.clients.forEach(client => {
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

    // Healthcheck
    res.writeHead(200, CORS_HEADERS);
    res.end("HaxBall SFX Server OK");
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws) => {
    console.log(`[WS] Cliente conectado. Total: ${wss.clients.size}`);
    ws.on("close", () => {
        console.log(`[WS] Cliente desconectado. Total: ${wss.clients.size}`);
    });
});

httpServer.listen(PORT, () => {
    console.log(`[SFX Server] Corriendo en puerto ${PORT}`);
});
