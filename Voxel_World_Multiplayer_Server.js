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
    // Allow the game page to call /health before opening its WebSocket.
    // This HTTP request wakes a sleeping Render service.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    if ((req.url === '/health' || req.url === '/') && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
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
        color: player.color,
        position: player.position,
        yaw: player.yaw,
        crouching: player.crouching === true,
        health: player.health
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
            const color = /^#[0-9a-fA-F]{6}$/.test(message.color || '') ? message.color : '#3d83d5';
            const spawnIndex = players.size;
            const spawnX = ((spawnIndex % 7) - 3) * 2 + 0.5;
            const spawnZ = (Math.floor(spawnIndex / 7) - 1) * 2 + 0.5;
            const player = {
                id,
                name,
                color,
                position: { x: spawnX, y: 30, z: spawnZ },
                yaw: 0,
                crouching: false,
                health: 20,
                lastRegenAt: Date.now(),
                lastPunchAt: 0
            };
            socket.playerId = id;
            players.set(id, { ...player, socket });

            send(socket, {
                type: 'welcome',
                id,
                health: player.health,
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
            player.crouching = message.crouching === true;
            broadcast({ type: 'player_state', player: cleanPlayer(player) }, socket);
            return;
        }

        if (message.type === 'punch') {
            const now = Date.now();
            const target = players.get(String(message.targetId || ''));
            if (!target || target.id === player.id || now - player.lastPunchAt < 500) return;
            const dx = target.position.x - player.position.x;
            const dz = target.position.z - player.position.z;
            const horizontalDistance = Math.hypot(dx, dz);
            const attackerFeet = player.position.y - (player.crouching ? 1.3 : 1.8);
            const targetFeet = target.position.y - (target.crouching ? 1.3 : 1.8);
            const verticalDistance = Math.abs((attackerFeet + 1.0) - (targetFeet + 0.9));
            const length = horizontalDistance || 1;
            const forwardX = -Math.sin(player.yaw);
            const forwardZ = -Math.cos(player.yaw);
            const facingDot = (dx / length) * forwardX + (dz / length) * forwardZ;
            if (horizontalDistance > 3.2 || verticalDistance > 1.8 || facingDot < 0.2) return;
            player.lastPunchAt = now;
            target.health = Math.max(0, target.health - 2);
            target.lastRegenAt = now;
            broadcast({ type: 'player_health', id: target.id, health: target.health });
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

const healthRegeneration = setInterval(() => {
    const now = Date.now();
    for (const player of players.values()) {
        if (player.health < 20 && now - player.lastRegenAt >= 4000) {
            player.health = Math.min(20, player.health + 1);
            player.lastRegenAt = now;
            broadcast({ type: 'player_health', id: player.id, health: player.health });
        }
    }
}, 500);

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

wss.on('close', () => { clearInterval(heartbeat); clearInterval(healthRegeneration); });

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Voxel World multiplayer server listening on port ${PORT}`);
});
