const http = require("http");
const { WebSocketServer } = require("ws");

const SECRET = process.env.SFX_SECRET || "cambiar_esto";
const PORT   = process.env.PORT || 3000;

// Servidor HTTP (Railway necesita uno para el healthcheck)
const httpServer = http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/sfx") {
        // Verificar token secreto en el header
        if (req.headers["x-sfx-secret"] !== SECRET) {
            res.writeHead(401);
            res.end("Unauthorized");
            return;
        }

        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            try {
                const data = JSON.parse(body);
                // Reenviar a todos los clientes WebSocket conectados
                let enviados = 0;
                wss.clients.forEach(client => {
                    if (client.readyState === 1) { // OPEN
                        client.send(JSON.stringify(data));
                        enviados++;
                    }
                });
                console.log(`[SFX] Evento "${data.tipo}" enviado a ${enviados} cliente(s)`);
                res.writeHead(200);
                res.end("OK");
            } catch (e) {
                res.writeHead(400);
                res.end("Bad JSON");
            }
        });
        return;
    }

    // Healthcheck para Railway
    res.writeHead(200);
    res.end("HaxBall SFX Server OK");
});

// Servidor WebSocket (las extensiones se conectan acá)
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
