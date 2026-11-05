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
const MAX_HEALTH = 20;
const PUNCH_DAMAGE = 1;
const PUNCH_REACH = 3.2;
const PUNCH_COOLDOWN_MS = 500;
const HEALTH_REGEN_INTERVAL_MS = 4000;
const PIG_COUNT = 14;
const PIG_MAX_HEALTH = 10;
const PIG_PUNCH_DAMAGE = 1;

function createSeed() {
    return (Math.floor(Math.random() * 2147483646) + 1) >>> 0;
}

const worldSeed = createSeed();
const worldEdits = new Map();
const players = new Map();
const pigHealth = new Map();
const cowHealth = new Map();
const chestStates = new Map();
const itemDrops = new Map();
const MAX_ITEM_DROPS = 2000;
const ITEM_DROP_TYPES = new Set([1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 20, 21, 22, 23, 24, 25,
    30, 31, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]);

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
        color: player.color,
        position: player.position,
        yaw: player.yaw,
        crouching: !!player.crouching,
        health: Number.isFinite(player.health) ? player.health : MAX_HEALTH
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
    if (!(Number.isInteger(message.x) &&
        Number.isInteger(message.y) &&
        Number.isInteger(message.z) &&
        message.x >= -HALF_WORLD && message.x < HALF_WORLD &&
        message.z >= -HALF_WORLD && message.z < HALF_WORLD &&
        message.y >= WORLD_BOTTOM && message.y <= 40 &&
        [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 20].includes(message.block))) return false;
    if (message.block === 3 && message.waterLevel !== undefined &&
        (!Number.isInteger(message.waterLevel) || message.waterLevel < 1 || message.waterLevel > 8)) return false;
    if (message.waterParent != null &&
        (typeof message.waterParent !== 'string' || !/^-?\d+,-?\d+,-?\d+$/.test(message.waterParent))) return false;
    return true;
}

function sendSync(socket) {
    send(socket, {
        type: 'sync',
        seed: worldSeed,
        edits: Array.from(worldEdits.values()),
        pigHealth: Array.from(pigHealth.entries()),
        cowHealth: Array.from(cowHealth.entries()),
        chests: Array.from(chestStates.entries()),
        itemDrops: Array.from(itemDrops.values())
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
                health: MAX_HEALTH,
                spawn: { x: spawnX, z: spawnZ },
                respawnAt: 0,
                lastPunchAt: 0,
                lastHealthRegenAt: Date.now()
            };
            socket.playerId = id;
            players.set(id, { ...player, socket });

            send(socket, {
                type: 'welcome',
                id,
                seed: worldSeed,
                health: player.health,
                edits: Array.from(worldEdits.values()),
                pigHealth: Array.from(pigHealth.entries()),
                cowHealth: Array.from(cowHealth.entries()),
                chests: Array.from(chestStates.entries()),
                itemDrops: Array.from(itemDrops.values()),
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
            player.crouching = !!message.crouching;
            broadcast({ type: 'player_state', player: cleanPlayer(player) }, socket);
            return;
        }

        if (message.type === 'punch') {
            const now = Date.now();
            if (player.health <= 0 || player.respawnAt || now - player.lastPunchAt < PUNCH_COOLDOWN_MS) return;
            if (typeof message.targetId !== 'string' || message.targetId === player.id) return;
            const target = players.get(message.targetId);
            if (!target || target.health <= 0 || target.respawnAt) return;

            const dx = target.position.x - player.position.x;
            const dz = target.position.z - player.position.z;
            const distance = Math.hypot(dx, dz);
            const verticalDistance = Math.abs(target.position.y - player.position.y);
            if (distance > PUNCH_REACH || verticalDistance > 2.4 || distance < 0.001) return;

            const punchYaw = Number.isFinite(message.yaw) ? message.yaw : player.yaw;
            const forwardX = -Math.sin(punchYaw);
            const forwardZ = -Math.cos(punchYaw);
            const facing = (dx / distance) * forwardX + (dz / distance) * forwardZ;
            if (facing < 0.35) return;

            player.lastPunchAt = now;
            target.health = Math.max(0, target.health - PUNCH_DAMAGE);
            target.lastHealthRegenAt = now;
            if (target.health <= 0) target.respawnAt = now + 3000;
            broadcast({
                type: 'health_update',
                id: target.id,
                health: target.health,
                attackerId: player.id
            });
            broadcast({ type: 'player_punched', targetId: target.id });
            return;
        }

        if (message.type === 'pig_punch') {
            const now = Date.now();
            if (player.health <= 0 || player.respawnAt || now - player.lastPunchAt < PUNCH_COOLDOWN_MS) return;
            if (typeof message.pigId !== 'string') return;
            const match = /^pig-(\d+)$/.exec(message.pigId);
            if (!match || Number(match[1]) < 0 || Number(match[1]) >= PIG_COUNT) return;
            const position = message.position;
            if (!isFinitePosition(position)) return;
            const dx = position.x - player.position.x;
            const dz = position.z - player.position.z;
            const horizontalDistance = Math.hypot(dx, dz);
            const verticalDistance = Math.abs((player.position.y - 1.7) - (position.y + 0.7));
            if (horizontalDistance > PUNCH_REACH + 0.5 || verticalDistance > 2.8) return;

            const currentHealth = pigHealth.has(message.pigId) ? pigHealth.get(message.pigId) : PIG_MAX_HEALTH;
            if (currentHealth <= 0) return;
            player.lastPunchAt = now;
            const nextHealth = Math.max(0, currentHealth - PIG_PUNCH_DAMAGE);
            pigHealth.set(message.pigId, nextHealth);
            broadcast({
                type: 'pig_hit',
                pigId: message.pigId,
                health: nextHealth,
                attackerId: player.id
            });
            return;
        }

        if (message.type === 'cow_punch') {
            const now = Date.now();
            if (player.health <= 0 || player.respawnAt || now - player.lastPunchAt < PUNCH_COOLDOWN_MS) return;
            if (typeof message.cowId !== 'string') return;
            const match = /^cow-(\d+)$/.exec(message.cowId);
            if (!match || Number(match[1]) < 0 || Number(match[1]) >= 10) return;
            const position = message.position;
            if (!isFinitePosition(position)) return;
            const dx = position.x - player.position.x;
            const dz = position.z - player.position.z;
            const horizontalDistance = Math.hypot(dx, dz);
            const verticalDistance = Math.abs((player.position.y - 1.7) - (position.y + 0.8));
            if (horizontalDistance > PUNCH_REACH + 0.7 || verticalDistance > 3.0) return;
            const currentHealth = cowHealth.has(message.cowId) ? cowHealth.get(message.cowId) : 10;
            if (currentHealth <= 0) return;
            player.lastPunchAt = now;
            const nextHealth = Math.max(0, currentHealth - PIG_PUNCH_DAMAGE);
            cowHealth.set(message.cowId, nextHealth);
            broadcast({ type: 'cow_hit', cowId: message.cowId, health: nextHealth, attackerId: player.id });
            return;
        }

        if (message.type === 'eat_food') {
            if (!Number.isInteger(message.amount) || ![2, 4].includes(message.amount) || player.health <= 0 || player.respawnAt) return;
            player.health = Math.min(MAX_HEALTH, player.health + message.amount);
            player.lastHealthRegenAt = Date.now();
            send(socket, { type: 'health_update', id: player.id, health: player.health, attackerId: null });
            return;
        }

        if (message.type === 'item_drop_request') {
            const now = Date.now();
            if (!ITEM_DROP_TYPES.has(message.itemType) || !Number.isInteger(message.count) ||
                message.count < 1 || message.count > 64 || !isFinitePosition({ x: message.x, y: message.y, z: message.z }) ||
                Math.hypot(message.x - player.position.x, message.z - player.position.z) > 8 ||
                Math.abs(message.y - player.position.y) > 12 || player.health <= 0 || player.respawnAt ||
                !Number.isFinite(message.vx || 0) || !Number.isFinite(message.vz || 0) ||
                Math.abs(message.vx || 0) > 6 || Math.abs(message.vz || 0) > 6 || itemDrops.size >= MAX_ITEM_DROPS) {
                send(socket, { type: 'item_drop_rejected', itemType: message.itemType, count: message.count });
                return;
            }
            const drop = {
                id: randomUUID(),
                itemType: message.itemType,
                count: message.count,
                x: message.x,
                y: message.y,
                z: message.z,
                vx: Number.isFinite(message.vx) ? message.vx : 0,
                vz: Number.isFinite(message.vz) ? message.vz : 0,
                createdAt: now,
                playerDropped: message.playerDropped === true,
                pickupAvailableAt: now + (message.playerDropped === true ? 850 : 0)
            };
            itemDrops.set(drop.id, drop);
            broadcast({ type: 'item_drop_spawn', drop });
            return;
        }

        if (message.type === 'item_pickup_request') {
            if (typeof message.id !== 'string' || player.health <= 0 || player.respawnAt) {
                send(socket, { type: 'item_pickup_rejected', id: message.id });
                return;
            }
            const drop = itemDrops.get(message.id);
            if (!drop) {
                send(socket, { type: 'item_pickup_rejected', id: message.id });
                return;
            }
            if (Date.now() < drop.pickupAvailableAt) {
                send(socket, { type: 'item_pickup_rejected', id: message.id });
                return;
            }
            // Use the server's damped throw projection and a forgiving range so
            // small player-state/network timing differences do not strand pickups.
            const elapsed = Math.max(0, (Date.now() - (drop.createdAt || Date.now())) / 1000);
            const travel = (1 - Math.exp(-3 * elapsed)) / 3;
            const dropX = drop.x + (drop.vx || 0) * travel;
            const dropZ = drop.z + (drop.vz || 0) * travel;
            if (Math.hypot(dropX - player.position.x, dropZ - player.position.z) > 3.25) {
                send(socket, { type: 'item_pickup_rejected', id: message.id });
                return;
            }
            // Delete before broadcasting: only the first valid request can win.
            itemDrops.delete(drop.id);
            broadcast({
                type: 'item_drop_removed',
                id: drop.id,
                pickerId: player.id,
                itemType: drop.itemType,
                count: drop.count
            });
            return;
        }

        if (message.type === 'chest_update') {
            if (typeof message.key !== 'string' || !/^-?\\d+,-?\\d+,-?\\d+$/.test(message.key) ||
                !Array.isArray(message.slots) || message.slots.length !== 27) return;
            const [x, y, z] = message.key.split(',').map(Number);
            if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(z) ||
                x < -HALF_WORLD || x >= HALF_WORLD || z < -HALF_WORLD || z >= HALF_WORLD ||
                y < WORLD_BOTTOM || y > 40 || worldEdits.get(message.key)?.block !== 13 &&
                !chestStates.has(message.key)) return;
            const allowedTypes = new Set([1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 20, 21, 22, 23, 24, 25,
                30, 31, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]);
            const slots = message.slots.map(stack => {
                if (!stack || !Number.isInteger(stack.type) || !allowedTypes.has(stack.type) ||
                    !Number.isInteger(stack.count) || stack.count < 1 || stack.count > 64) return null;
                return { type: stack.type, count: stack.count };
            });
            chestStates.set(message.key, slots);
            broadcast({ type: 'chest_update', key: message.key, slots });
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
            if (message.block === 3) {
                edit.waterLevel = Number.isInteger(message.waterLevel) ? message.waterLevel : 8;
                if (typeof message.waterParent === 'string') edit.waterParent = message.waterParent;
            }
            worldEdits.set(key, edit);
            if (message.block === 0) chestStates.delete(key);
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

const healthRegenTimer = setInterval(() => {
    const now = Date.now();
    for (const player of players.values()) {
        if (player.respawnAt) {
            if (now < player.respawnAt) continue;
            player.respawnAt = 0;
            player.health = MAX_HEALTH;
            player.position = { x: player.spawn.x, y: 30, z: player.spawn.z };
            player.yaw = 0;
            player.crouching = false;
            player.lastHealthRegenAt = now;
            broadcast({
                type: 'health_update',
                id: player.id,
                health: MAX_HEALTH,
                respawn: true,
                spawn: player.spawn,
                attackerId: null
            });
            broadcast({ type: 'player_state', player: cleanPlayer(player) });
            continue;
        }
        if (player.health <= 0 || player.health >= MAX_HEALTH || now - player.lastHealthRegenAt < HEALTH_REGEN_INTERVAL_MS) continue;
        player.health = Math.min(MAX_HEALTH, player.health + 1);
        player.lastHealthRegenAt = now;
        broadcast({
            type: 'health_update',
            id: player.id,
            health: player.health,
            attackerId: null
        });
    }
}, 250);

server.on('close', () => clearInterval(healthRegenTimer));

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Voxel World multiplayer server listening on port ${PORT}`);
});
