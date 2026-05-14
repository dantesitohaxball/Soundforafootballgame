# HaxBall SFX Server

Servidor intermediario para efectos de sonido en HaxBall.

## Cómo funciona

- El script headless manda eventos por HTTP POST
- El servidor los reenvía a todas las extensiones conectadas por WebSocket
- Las extensiones reproducen el sonido correspondiente

## Variables de entorno (configurar en Railway)

| Variable | Descripción |
|---|---|
| `SFX_SECRET` | Token secreto compartido entre el headless y el servidor |
| `PORT` | Puerto (Railway lo asigna automáticamente) |
