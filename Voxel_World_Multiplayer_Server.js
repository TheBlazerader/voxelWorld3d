// Voxel World Multiplayer Server
// Deploy as a separate Render Web Service from the Ramp Rush server.
// Build command: npm install
// Start command: node Voxel_World_Multiplayer_Server.js

const http = require('http');
const WebSocket = require('ws');
const { randomUUID } = require('crypto');

const PORT = process.env.PORT || 10000;
const WORLD_SIZE = 144;
const HALF_WORLD = WORLD_SIZE / 2;
const WORLD_BOTTOM = 0;
const MAX_PLAYERS = 32;
const MAX_MESSAGE_BYTES = 64 * 1024;
const MAX_EDITS = 100000;

function createSeed() {
    return (Math.floor(Math.random() * 2147483646) + 1) >>> 0;
}

const worldSeed = createSeed();
const worldEdits = new Map();
const players = new Map();

const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
            service: 'Voxel World Multiplayer Server',
            status: 'ok',
            players: players.size,
            edits: worldEdits.size
        }));
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
});

const wss = new WebSocket.Server({
    server,
    path: '/ws',
    maxPayload: MAX_MESSAGE_BYTES
});

function send(socket, message) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    }
}

function broadcast(message, exceptSocket = null) {
    const data = JSON.stringify(message);
    for (const client of wss.clients) {
        if (client !== exceptSocket && client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    }
}

function cleanPlayer(player) {
    return {
        id: player.id,
        name: player.name,
        position: player.position,
        yaw: player.yaw
    };
}

function isFinitePosition(position) {
    return !!position &&
        Number.isFinite(position.x) &&
        Number.isFinite(position.y) &&
        Number.isFinite(position.z) &&
        Math.abs(position.x) <= HALF_WORLD &&
        Math.abs(position.z) <= HALF_WORLD &&
        position.y >= -20 && position.y <= 100;
}

function validEdit(message) {
    return Number.isInteger(message.x) &&
        Number.isInteger(message.y) &&
        Number.isInteger(message.z) &&
        message.x >= -HALF_WORLD && message.x < HALF_WORLD &&
        message.z >= -HALF_WORLD && message.z < HALF_WORLD &&
        message.y >= WORLD_BOTTOM && message.y <= 40 &&
        [0, 1, 2].includes(message.block);
}

function sendSync(socket) {
    send(socket, {
        type: 'sync',
        seed: worldSeed,
        edits: Array.from(worldEdits.values())
    });
}

wss.on('connection', socket => {
    socket.isAlive = true;
    socket.playerId = null;
    socket.lastStateAt = 0;
    socket.lastEditAt = 0;

    socket.on('pong', () => { socket.isAlive = true; });

    socket.on('message', raw => {
        let message;
        try {
            message = JSON.parse(raw.toString());
        } catch {
            send(socket, { type: 'server_error', message: 'Invalid message format.' });
            return;
        }
        if (!message || typeof message.type !== 'string') return;

        if (message.type === 'join') {
            if (socket.playerId) return;
            if (players.size >= MAX_PLAYERS) {
                send(socket, { type: 'server_error', message: 'This world is full.' });
                socket.close(1008, 'World full');
                return;
            }

            const id = randomUUID();
            const name = String(message.name || 'Player')
                .replace(/[<>\u0000-\u001f]/g, '')
                .trim()
                .slice(0, 20) || 'Player';
            const spawnIndex = players.size;
            const spawnX = ((spawnIndex % 7) - 3) * 2 + 0.5;
            const spawnZ = (Math.floor(spawnIndex / 7) - 1) * 2 + 0.5;
            const player = {
                id,
                name,
                position: { x: spawnX, y: 30, z: spawnZ },
                yaw: 0
            };
            socket.playerId = id;
            players.set(id, { ...player, socket });

            send(socket, {
                type: 'welcome',
                id,
                seed: worldSeed,
                edits: Array.from(worldEdits.values()),
                players: Array.from(players.values())
                    .filter(other => other.id !== id)
                    .map(cleanPlayer),
                spawn: { x: spawnX, z: spawnZ }
            });
            broadcast({ type: 'player_joined', player: cleanPlayer(player) }, socket);
            return;
        }

        if (!socket.playerId) {
            send(socket, { type: 'server_error', message: 'Join the world first.' });
            return;
        }

        const player = players.get(socket.playerId);
        if (!player) return;

        if (message.type === 'player_state') {
            const now = Date.now();
            if (now - socket.lastStateAt < 35) return;
            socket.lastStateAt = now;
            if (!isFinitePosition(message.position)) return;
            player.position = {
                x: message.position.x,
                y: message.position.y,
                z: message.position.z
            };
            player.yaw = Number.isFinite(message.yaw) ? message.yaw : 0;
            broadcast({ type: 'player_state', player: cleanPlayer(player) }, socket);
            return;
        }

        if (message.type === 'block_edit') {
            const now = Date.now();
            if (now - socket.lastEditAt < 35 || !validEdit(message)) {
                send(socket, { type: 'edit_rejected' });
                return;
            }
            socket.lastEditAt = now;
            const key = `${message.x},${message.y},${message.z}`;
            if (!worldEdits.has(key) && worldEdits.size >= MAX_EDITS) {
                send(socket, { type: 'edit_rejected' });
                return;
            }
            const edit = {
                x: message.x,
                y: message.y,
                z: message.z,
                block: message.block
            };
            worldEdits.set(key, edit);
            broadcast({ type: 'block_edit', edit });
            return;
        }

        if (message.type === 'request_sync') {
            sendSync(socket);
        }
    });

    socket.on('close', () => {
        if (!socket.playerId) return;
        const id = socket.playerId;
        players.delete(id);
        broadcast({ type: 'player_left', id });
    });

    socket.on('error', error => {
        console.error('WebSocket error:', error.message);
    });
});

const heartbeat = setInterval(() => {
    for (const socket of wss.clients) {
        if (socket.isAlive === false) {
            socket.terminate();
            continue;
        }
        socket.isAlive = false;
        socket.ping();
    }
}, 30000);

wss.on('close', () => clearInterval(heartbeat));

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Voxel World multiplayer server listening on port ${PORT}`);
});
