<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Voxel World - 3D Sandbox</title>

<style>
    * {
        box-sizing: border-box;
    }

    body {
        margin: 0;
        overflow: hidden;
        background: #87ceeb;
        font-family: Arial, sans-serif;
        color: white;
    }

    canvas {
        display: block;
    }

    #hud {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 10;
    }

    #title {
        position: absolute;
        top: 15px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 24px;
        font-weight: bold;
        text-shadow: 2px 2px 4px #000;
        white-space: nowrap;
    }

    #stats {
        position: absolute;
        top: 15px;
        left: 15px;
        background: rgba(0, 0, 0, 0.58);
        padding: 12px 15px;
        border-radius: 8px;
        line-height: 1.8;
        font-size: 14px;
    }

    .grass-text {
        color: #72ff72;
    }

    .dirt-text {
        color: #d99b62;
    }

    .water-text {
        color: #70d8ff;
    }

    #crosshair {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 26px;
        font-weight: bold;
        color: white;
        text-shadow: 1px 1px 3px black;
    }

    #health {
        position: absolute;
        left: calc(50% - 240px);
        bottom: 145px;
        display: flex;
        gap: 2px;
        padding: 4px 7px;
        border-radius: 6px;
        background: rgba(0, 0, 0, 0.48);
        font-size: 25px;
        line-height: 1;
        text-shadow: none;
        white-space: nowrap;
        z-index: 11;
    }
    .heart { color: #e83d4d; filter: drop-shadow(1px 1px 1px #000); }
    .heart.half {
        color: transparent;
        background: linear-gradient(90deg, #e83d4d 50%, #777 50%);
        background-clip: text;
        -webkit-background-clip: text;
    }
    .heart.empty { color: #777; }

    #hotbar {
        position: absolute;
        left: 50%;
        bottom: 82px;
        transform: translateX(-50%);
        display: flex;
        gap: 5px;
        padding: 7px;
        background: rgba(0, 0, 0, 0.62);
        border: 2px solid rgba(255, 255, 255, 0.45);
        border-radius: 8px;
        pointer-events: none;
    }

    .hotbar-slot {
        position: relative;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(40, 40, 40, 0.8);
        border: 2px solid rgba(190, 190, 190, 0.55);
        border-radius: 5px;
    }

    .hotbar-slot.selected {
        border: 3px solid #fff36a;
        background: rgba(255, 243, 106, 0.22);
        box-shadow: 0 0 8px rgba(255, 243, 106, 0.8);
    }

    .hotbar-number {
        position: absolute;
        top: 1px;
        left: 4px;
        font-size: 10px;
        color: white;
        text-shadow: 1px 1px 2px black;
    }

    .hotbar-icon {
        width: 22px;
        height: 22px;
        border: 2px solid rgba(255,255,255,0.65);
        box-shadow: inset -3px -3px 0 rgba(0,0,0,0.18);
    }

    .hotbar-icon.grass {
        background: linear-gradient(to bottom, #65c94b 0 35%, #87532e 35% 100%);
    }

    .hotbar-icon.dirt {
        background: #87532e;
    }

    .hotbar-icon.wood {
        background: repeating-linear-gradient(90deg, #59351f 0 5px, #70452a 5px 8px);
    }

    .hotbar-icon.leaves {
        background: #26702b;
    }

    .hotbar-count {
        position: absolute;
        right: 3px;
        bottom: 1px;
        font-size: 11px;
        font-weight: bold;
        color: white;
        text-shadow: 1px 1px 2px black;
    }

    #help {
        background: rgba(0, 0, 0, 0.45);
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 12px;
        line-height: 1.8;
        text-align: center;
        margin: 18px auto 0;
        width: max-content;
        max-width: calc(100vw - 40px);
    }

    #start-screen {
        position: fixed;
        inset: 0;
        z-index: 20;
        background: rgba(0, 0, 0, 0.72);
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
    }

    #game-over {
        position: fixed;
        inset: 0;
        z-index: 30;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(145, 0, 0, 0.58);
        text-align: center;
        pointer-events: none;
    }
    #game-over-message {
        color: #fff;
        font-size: clamp(42px, 8vw, 76px);
        font-weight: 900;
        letter-spacing: 2px;
        text-shadow: 0 4px 16px #300, 2px 2px 4px #000;
    }

    #start-box {
        max-width: 480px;
        padding: 30px;
    }

    #start-box h1 {
        font-size: 40px;
        margin-bottom: 10px;
    }

    #start-box p {
        line-height: 1.7;
        color: #ddd;
    }

    #start-button {
        border: none;
        background: #48ad42;
        color: white;
        padding: 15px 32px;
        font-size: 18px;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
        margin-top: 12px;
    }

    #start-button:hover {
        background: #5bc952;
    }

    #multiplayer-panel {
        margin: 14px auto 0;
        padding: 12px;
        max-width: 420px;
        background: rgba(20, 30, 40, 0.78);
        border: 1px solid rgba(255,255,255,0.25);
        border-radius: 8px;
        text-align: left;
    }
    #multiplayer-panel label { display:block; font-size:12px; margin:7px 0 4px; color:#ddd; }
    #multiplayer-panel input:not([type="color"]) {
        width:100%; padding:9px; border:1px solid #667; border-radius:5px;
        background:#101820; color:white; font-size:14px;
    }
    #multiplayer-panel input[type="color"] {
        width:100%; height:38px; padding:3px; border:1px solid #667;
        border-radius:5px; background:#101820; cursor:pointer;
    }
    #multiplayer-actions { display:flex; gap:8px; margin-top:9px; }
    #multiplayer-actions button {
        flex:1; border:0; border-radius:5px; padding:9px 10px; cursor:pointer;
        color:white; font-weight:bold; background:#2879b9;
    }
    #multiplayer-actions button:last-child { background:#555; }
    #multiplayer-status { margin-top:8px; font-size:12px; color:#bde7ff; min-height:16px; }
    #camera-settings {
        margin: 12px auto 0;
        padding: 10px 12px;
        max-width: 420px;
        background: rgba(20, 30, 40, 0.78);
        border: 1px solid rgba(255,255,255,0.25);
        border-radius: 8px;
        text-align: left;
        font-size: 12px;
    }
    #camera-settings input { width: 100%; cursor: pointer; }
    #camera-sensitivity-value { float: right; color: #bde7ff; }
    #online-players {
        position:absolute; right:15px; top:15px; padding:10px 12px;
        border-radius:8px; background:rgba(0,0,0,.58); font-size:12px;
        line-height:1.6; max-width:190px; text-align:left;
    }
    #message {
        position: absolute;
        top: 90px;
        left: 50%;
        transform: translateX(-50%);
        font-weight: bold;
        font-size: 14px;
        text-shadow: 1px 1px 3px black;
        white-space: nowrap;
    }

    @media (max-width: 600px) {
        #title {
            font-size: 19px;
        }

        #stats {
            font-size: 12px;
            padding: 8px;
        }

        #help {
            font-size: 10px;
        }

        #hotbar {
            bottom: 88px;
            gap: 3px;
            padding: 5px;
        }

        #health {
            left: 12px;
            bottom: 142px;
            font-size: 21px;
            gap: 0;
        }

        .hotbar-slot {
            width: 34px;
            height: 38px;
        }

        .hotbar-icon {
            width: 18px;
            height: 18px;
        }
    }
</style>
</head>

<body>

<div id="hud">
    <div id="title">VOXEL WORLD</div>

    <div id="stats">
        <div>🌊 Water level: <span id="water-level">7</span></div>
        <div>📍 Position: <span id="position">0, 0, 0</span></div>
    </div>

    <div id="online-players">Online: 1</div>
    <div id="crosshair">+</div>
    <div id="message"></div>
    <div id="health" aria-label="Health: 10 hearts"></div>
    <div id="hotbar" aria-label="Block hotbar"></div>

</div>

<div id="start-screen">
    <div id="start-box">
        <h1>🌍 Voxel World</h1>
        <p>
            Explore a procedurally generated 3D world filled with
            grassy hills, dirt layers, valleys, and transparent water.
        </p>
        <p>
            Break blocks, collect them, and build your own structures.
        </p>
        <div id="multiplayer-panel">
            <strong>ONLINE MULTIPLAYER</strong>
            <label for="multiplayer-name">Player name</label>
            <input id="multiplayer-name" maxlength="20" value="Player" autocomplete="nickname">
            <label for="multiplayer-color">Body color</label>
            <input id="multiplayer-color" type="color" value="#3d83d5" aria-label="Choose your player body color">
            <div style="font-size:11px;color:#bbb;margin-top:5px">Server: wss://voxelworld3d.onrender.com/ws</div>
            <div id="multiplayer-actions">
                <button id="connect-multiplayer">CONNECT</button>
                <button id="disconnect-multiplayer">DISCONNECT</button>
            </div>
            <div id="multiplayer-status">Offline — you can play solo or connect to a shared world.</div>
        </div>
        <div id="camera-settings">
            <label for="camera-sensitivity">Camera sensitivity <span id="camera-sensitivity-value">1.0×</span></label>
            <input id="camera-sensitivity" type="range" min="0.3" max="3" step="0.1" value="1">
            <div style="color:#bbb">Adjusts mouse and arrow-key camera movement.</div>
            <label for="crouch-toggle-setting" style="display:flex;align-items:center;gap:8px;margin-top:12px;cursor:pointer">
                <input id="crouch-toggle-setting" type="checkbox" checked style="width:auto">
                Crouch toggle (C)
            </label>
            <div style="color:#bbb;margin-top:4px">On: press C to toggle crouching. Off: hold C to crouch.</div>
        </div>
        <button id="start-button">PLAY WORLD</button>
        <div id="help">
            <strong>CONTROLS</strong><br>
            WASD: Move &nbsp; | &nbsp; Mouse / Arrow Keys: Look<br>
            Hold SPACE: Auto-jump &nbsp; | &nbsp; SHIFT: Sprint &nbsp; | &nbsp; C: Crouch<br>
            Left Click / N: Punch player or break block &nbsp; | &nbsp; Right Click / M: Place<br>
            1–9: Select Hotbar Slot &nbsp; | &nbsp; P / ESC: Pause / Resume
        </div>
        <p style="font-size:12px">
            Best experienced on a desktop browser.
        </p>
    </div>
</div>

<div id="game-over" role="status" aria-live="assertive">
    <div id="game-over-message">Game over</div>
</div>

<script type="importmap">
{
    "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js"
    }
}
</script>

<script type="module">

import * as THREE from "three";

// =====================================================
// CONFIGURATION
// =====================================================

const WORLD_SIZE = 144;
const HALF_WORLD = WORLD_SIZE / 2;

const WATER_LEVEL = 7;
const WORLD_BOTTOM = 0;

const BLOCK_GRASS = 1;
const BLOCK_DIRT = 2;
const BLOCK_WATER = 3;
const BLOCK_WOOD = 4;
const BLOCK_LEAVES = 5;

let selectedBlock = BLOCK_GRASS;

let grassInventory = 0;
let dirtInventory = 0;
let woodInventory = 0;
let leavesInventory = 0;
const hotbar = [];

const PLAYER_HEIGHT = 1.8;
const CROUCH_HEIGHT = 1.3;
const PLAYER_RADIUS = 0.30;
const EYE_HEIGHT = 1.7;
let crouching = false;
let crouchToggleMode = true;

function getPlayerHeight(isCrouching = crouching) {
    return isCrouching ? CROUCH_HEIGHT : PLAYER_HEIGHT;
}

const WALK_SPEED = 5.0;
const SPRINT_SPEED = 8.5;
const JUMP_SPEED = 8.0;
const GRAVITY = 22.0;

const REACH_DISTANCE = 4;

const blocks = new Map();

const keys = Object.create(null);

let velocityY = 0;
let grounded = false;
let gameStarted = false;
let gamePaused = true;
let pauseState = "menu"; // menu, playing, paused, dead

let yaw = 0;
let pitch = 0;
let cameraSensitivity = 1.0;
let health = 20;
let healthRegenElapsed = 0;
let gameOver = false;
let lastPunchAt = 0;
const PUNCH_COOLDOWN_MS = 500;
const PUNCH_REACH = 3.2;

const player = {
    x: 0,
    y: 15,
    z: 0
};

const clock = new THREE.Clock();

// =====================================================
// MULTIPLAYER STATE
// =====================================================

let multiplayerSocket = null;
let multiplayerConnected = false;
let multiplayerReady = false;
let multiplayerPlayerId = null;
let multiplayerLastStateSent = 0;
let multiplayerPlayerName = "Player";
const MULTIPLAYER_SERVER_URL = "wss://voxelworld3d.onrender.com/ws";
const remotePlayers = new Map();
const pendingRemoteStates = new Map();
const REMOTE_INTERPOLATION = 0.18;

function multiplayerStatus(message) {
    const element = document.getElementById("multiplayer-status");
    if (element) element.textContent = message;
}

function multiplayerSend(message) {
    if (multiplayerSocket && multiplayerSocket.readyState === WebSocket.OPEN) {
        multiplayerSocket.send(JSON.stringify(message));
        return true;
    }
    return false;
}

function connectMultiplayer() {
    if (multiplayerSocket && multiplayerSocket.readyState <= WebSocket.OPEN) {
        multiplayerStatus("Already connecting or connected.");
        return;
    }
    const url = MULTIPLAYER_SERVER_URL;
    multiplayerPlayerName = document.getElementById("multiplayer-name").value.trim().slice(0, 20) || "Player";
    const multiplayerPlayerColor = document.getElementById("multiplayer-color").value;
    multiplayerStatus("Connecting...");
    try {
        multiplayerSocket = new WebSocket(url);
        multiplayerSocket.addEventListener("open", () => {
            multiplayerConnected = true;
            multiplayerSend({ type: "join", name: multiplayerPlayerName, color: multiplayerPlayerColor });
            multiplayerStatus("Connected — joining shared world...");
        });
        multiplayerSocket.addEventListener("message", event => {
            let message;
            try { message = JSON.parse(event.data); } catch { return; }
            handleMultiplayerMessage(message);
        });
        multiplayerSocket.addEventListener("error", () => {
            multiplayerStatus("Connection error. Check the server URL and Render service.");
        });
        multiplayerSocket.addEventListener("close", () => {
            multiplayerConnected = false;
            multiplayerReady = false;
            multiplayerPlayerId = null;
            clearRemotePlayers();
            multiplayerStatus("Disconnected.");
            updateOnlinePlayerCount();
        });
    } catch (error) {
        multiplayerStatus("Could not connect: " + error.message);
    }
}

function disconnectMultiplayer() {
    if (multiplayerSocket) {
        const socket = multiplayerSocket;
        multiplayerSocket = null;
        socket.close();
    }
    multiplayerConnected = false;
    multiplayerReady = false;
    multiplayerPlayerId = null;
    clearRemotePlayers();
    multiplayerStatus("Disconnected.");
    updateOnlinePlayerCount();
}

document.getElementById("connect-multiplayer").addEventListener("click", connectMultiplayer);
document.getElementById("disconnect-multiplayer").addEventListener("click", disconnectMultiplayer);

function handleMultiplayerMessage(message) {
    if (!message || typeof message.type !== "string") return;
    if (message.type === "welcome") {
        // Online worlds start with an empty inventory.
        grassInventory = 0;
        dirtInventory = 0;
        woodInventory = 0;
        leavesInventory = 0;
        hotbar.length = 0;
        selectedBlock = BLOCK_GRASS;
        updateHUD();
        multiplayerPlayerId = message.id;
        health = Number.isFinite(message.health) ? THREE.MathUtils.clamp(message.health, 0, 20) : 20;
        updateHealthDisplay();
        // Every client regenerates from the same server-issued seed, then applies
        // the current shared edits before rendering any chunks.
        if (Number.isInteger(message.seed)) {
            randomSeed = message.seed;
            generateWorld();
            if (message.spawn && Number.isFinite(message.spawn.x) && Number.isFinite(message.spawn.z)) {
                player.x = message.spawn.x;
                player.z = message.spawn.z;
                player.y = terrainHeight(Math.floor(player.x), Math.floor(player.z)) + 1 + PLAYER_HEIGHT + 0.01;
                while (collidesAt(player.x, player.y, player.z) && player.y < 40) player.y += 1;
                camera.position.set(player.x, player.y, player.z);
            }
            if (Array.isArray(message.edits)) {
                for (const edit of message.edits) {
                    if (isValidRemoteEdit(edit)) setBlock(edit.x, edit.y, edit.z, edit.block);
                }
            }
            rebuildWorldMeshes();
            updateHUD();
        }
        multiplayerReady = true;
        multiplayerStatus("Connected to shared world.");
        if (Array.isArray(message.players)) {
            for (const other of message.players) addOrUpdateRemotePlayer(other);
        }
        updateOnlinePlayerCount();
    } else if (message.type === "player_joined") {
        addOrUpdateRemotePlayer(message.player);
        updateOnlinePlayerCount();
    } else if (message.type === "player_left") {
        removeRemotePlayer(message.id);
        updateOnlinePlayerCount();
    } else if (message.type === "player_punched") {
        const remote = remotePlayers.get(message.targetId);
        if (remote) remote.hitFlashUntil = performance.now() + 300;
    } else if (message.type === "player_state") {
        if (message.player && message.player.id !== multiplayerPlayerId) {
            addOrUpdateRemotePlayer(message.player);
        }
    } else if (message.type === "block_edit") {
        const edit = message.edit;
        if (!isValidRemoteEdit(edit)) return;
        setBlock(edit.x, edit.y, edit.z, edit.block);
        rebuildAffectedChunks(edit.x, edit.z);
    } else if (message.type === "edit_rejected") {
        multiplayerStatus("A block change was rejected by the server. Rejoining to resync...");
        multiplayerSend({ type: "request_sync" });
    } else if (message.type === "sync") {
        if (Array.isArray(message.edits)) {
            // Rebuild the shared terrain from the server's canonical seed and edit list.
            if (Number.isInteger(message.seed)) randomSeed = message.seed;
            generateWorld();
            for (const edit of message.edits) if (isValidRemoteEdit(edit)) setBlock(edit.x, edit.y, edit.z, edit.block);
            rebuildWorldMeshes();
        }
    } else if (message.type === "health_update") {
        if (message.id === multiplayerPlayerId) {
            health = THREE.MathUtils.clamp(Number(message.health) || 0, 0, 20);
            updateHealthDisplay();
            if (message.respawn && health > 0) {
                completeRespawn(message.spawn);
            } else if (health <= 0) {
                enterGameOver();
            } else if (message.attackerId && message.attackerId !== multiplayerPlayerId) {
                showMessage("You were punched!");
            }
        }
    } else if (message.type === "server_error") {
        multiplayerStatus(message.message || "The server reported an error.");
    }
}

function isValidRemoteEdit(edit) {
    return !!edit && Number.isInteger(edit.x) && Number.isInteger(edit.y) && Number.isInteger(edit.z) &&
        isInsideWorld(edit.x, edit.z) && edit.y >= WORLD_BOTTOM && edit.y <= 40 &&
        [0, BLOCK_GRASS, BLOCK_DIRT, BLOCK_WATER, BLOCK_WOOD, BLOCK_LEAVES].includes(edit.block);
}

function createRemotePlayer(playerData) {
    const group = new THREE.Group();
    const bodyColor = /^#[0-9a-fA-F]{6}$/.test(playerData.color || "") ? playerData.color : "#3d83d5";
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 1.3, 0.62),
        new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.8 })
    );
    body.position.y = 0.65;
    body.userData.remotePlayerId = playerData.id;
    body.userData.baseColor = body.material.color.getHex();
    body.castShadow = true;
    group.add(body);
    const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.48, 0.48),
        new THREE.MeshStandardMaterial({ color: 0xe4b88b, roughness: 0.9 })
    );
    head.position.y = 1.56;
    head.userData.remotePlayerId = playerData.id;
    head.userData.baseColor = head.material.color.getHex();
    head.castShadow = true;
    group.add(head);
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 256; labelCanvas.height = 64;
    const ctx = labelCanvas.getContext("2d");
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(4, 4, 248, 56);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText(String(playerData.name || "Player").slice(0, 20), 128, 42);
    const texture = new THREE.CanvasTexture(labelCanvas);
    const label = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 0.55),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    );
    label.position.y = 2.08;
    group.add(label);
    group.userData.labelTexture = texture;
    scene.add(group);
    return group;
}

function addOrUpdateRemotePlayer(data) {
    if (!data || !data.id || data.id === multiplayerPlayerId || !data.position) return;
    let remote = remotePlayers.get(data.id);
    if (!remote) {
        remote = { group: createRemotePlayer(data), target: { x: 0, y: 0, z: 0 }, yaw: 0, crouching: false };
        remotePlayers.set(data.id, remote);
    }
    if (![data.position.x, data.position.y, data.position.z].every(Number.isFinite)) return;
    remote.target.x = data.position.x;
    remote.crouching = !!data.crouching;
    const remoteHeight = getPlayerHeight(remote.crouching);
    remote.target.y = data.position.y - remoteHeight;
    remote.target.z = data.position.z;
    remote.yaw = Number.isFinite(data.yaw) ? data.yaw : 0;
    remote.group.scale.y = remoteHeight / PLAYER_HEIGHT;
    const label = remote.group.children.find(child => child.geometry && child.geometry.type === "PlaneGeometry");
    if (label) label.position.y = 2.08 / remote.group.scale.y;
    remote.name = data.name || "Player";
}

function removeRemotePlayer(id) {
    const remote = remotePlayers.get(id);
    if (!remote) return;
    scene.remove(remote.group);
    remote.group.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
            if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
            else object.material.dispose();
        }
    });
    remotePlayers.delete(id);
}

function clearRemotePlayers() {
    for (const id of [...remotePlayers.keys()]) removeRemotePlayer(id);
}

function updateOnlinePlayerCount() {
    const element = document.getElementById("online-players");
    if (element) element.textContent = `Online: ${1 + remotePlayers.size}`;
}

function updateRemotePlayers(delta) {
    const amount = 1 - Math.pow(1 - REMOTE_INTERPOLATION, delta * 60);
    for (const remote of remotePlayers.values()) {
        remote.group.position.x += (remote.target.x - remote.group.position.x) * amount;
        remote.group.position.y += (remote.target.y - remote.group.position.y) * amount;
        remote.group.position.z += (remote.target.z - remote.group.position.z) * amount;
        remote.group.rotation.y = remote.yaw;
        const flashing = performance.now() < (remote.hitFlashUntil || 0);
        for (const child of remote.group.children) {
            if (child.material && child.material.color && Number.isFinite(child.userData.baseColor)) {
                child.material.color.setHex(flashing ? 0xff2020 : child.userData.baseColor);
            }
        }
        const nameTag = remote.group.children.find(child => child.geometry && child.geometry.type === "PlaneGeometry");
        if (nameTag) nameTag.lookAt(camera.position);
    }
}

function sendMultiplayerState(now) {
    if (!multiplayerReady || now - multiplayerLastStateSent < 50) return;
    multiplayerLastStateSent = now;
    multiplayerSend({ type: "player_state", position: { x: player.x, y: player.y, z: player.z }, yaw, crouching });
}

function sendBlockEdit(x, y, z, block) {
    if (multiplayerReady) multiplayerSend({ type: "block_edit", x, y, z, block });
}

function updateHealthDisplay() {
    const element = document.getElementById("health");
    if (!element) return;
    element.innerHTML = "";
    for (let i = 0; i < 10; i++) {
        const heart = document.createElement("span");
        const points = health - i * 2;
        heart.className = "heart " + (points >= 2 ? "full" : points >= 1 ? "half" : "empty");
        heart.textContent = "♥";
        element.appendChild(heart);
    }
    element.setAttribute("aria-label", `Health: ${health} of 20`);
}

function clearGameplayKeys() {
    for (const code of Object.keys(keys)) keys[code] = false;
}

function setPauseState(nextState) {
    // The game state is authoritative. Pointer lock never changes pause state.
    pauseState = nextState;
    gamePaused = nextState !== "playing";
    gameOver = nextState === "dead";

    if (nextState === "playing") {
        startScreen.style.display = "none";
        startButton.textContent = "RESUME WORLD";
        document.getElementById("game-over").style.display = "none";
    } else if (nextState === "dead") {
        startScreen.style.display = "none";
        document.getElementById("game-over").style.display = "flex";
    } else {
        startScreen.style.display = "flex";
        startButton.textContent = nextState === "menu" ? "PLAY WORLD" : "RESUME WORLD";
        document.getElementById("game-over").style.display = "none";
    }
}

function enterGameOver() {
    if (gameOver) return;
    health = 0;
    healthRegenElapsed = 0;
    updateHealthDisplay();
    clearGameplayKeys();
    setPauseState("dead");
    if (document.pointerLockElement === renderer.domElement) {
        document.exitPointerLock();
    }
}

function completeRespawn(spawn) {
    if (spawn && Number.isFinite(spawn.x) && Number.isFinite(spawn.z)) {
        player.x = spawn.x;
        player.z = spawn.z;
    }
    player.y = terrainHeight(Math.floor(player.x), Math.floor(player.z)) + 1 + PLAYER_HEIGHT + 0.01;
    crouching = false;
    velocityY = 0;
    grounded = false;
    camera.position.set(player.x, player.y, player.z);
    health = 20;
    healthRegenElapsed = 0;
    clearGameplayKeys();
    gameStarted = true;
    updateHealthDisplay();
    updateHUD();
    setPauseState("paused");
    if (document.pointerLockElement === renderer.domElement) {
        document.exitPointerLock();
    }
    multiplayerSend({ type: "player_state", position: { x: player.x, y: player.y, z: player.z }, yaw, crouching: false });
}

// Aim-based targeting: only a remote player's visible body/head directly
// under the crosshair can be punched. A solid block closer to the camera
// takes priority, so clicking through a wall never hits a player.
const remotePlayerRaycaster = new THREE.Raycaster();
const remotePlayerAimPoint = new THREE.Vector2(0, 0);

function findLookedAtRemotePlayer() {
    if (!multiplayerReady || remotePlayers.size === 0) return null;

    camera.updateMatrixWorld(true);
    scene.updateMatrixWorld(true);
    remotePlayerRaycaster.setFromCamera(remotePlayerAimPoint, camera);
    remotePlayerRaycaster.near = 0;
    remotePlayerRaycaster.far = PUNCH_REACH;

    const targetMeshes = [];
    for (const [id, remote] of remotePlayers) {
        const dx = remote.target.x - player.x;
        const dz = remote.target.z - player.z;
        if (Math.hypot(dx, dz) > PUNCH_REACH) continue;

        for (const child of remote.group.children) {
            if (child.isMesh && child.userData.remotePlayerId === id) {
                targetMeshes.push(child);
            }
        }
    }

    if (targetMeshes.length === 0) return null;
    const intersections = remotePlayerRaycaster.intersectObjects(targetMeshes, false);
    if (intersections.length === 0) return null;

    const nearestHit = intersections[0];
    const targetId = nearestHit.object.userData.remotePlayerId;
    if (!targetId) return null;

    const blockTarget = getTargetBlock();
    if (blockTarget && blockTarget.distance + 0.05 < nearestHit.distance) {
        return null;
    }

    return targetId;
}

function punchPlayer() {
    if (!gameStarted || pauseState !== "playing" || !multiplayerReady) return false;

    const targetId = findLookedAtRemotePlayer();
    if (!targetId) return false;

    const now = performance.now();
    if (now - lastPunchAt < PUNCH_COOLDOWN_MS) {
        showMessage("Punch is cooling down");
        return true;
    }

    lastPunchAt = now;
    multiplayerSend({ type: "punch", targetId, yaw });
    showMessage("Punch!");
    return true;
}

function setCrouching(nextCrouching) {
    if (!gameStarted || crouching === nextCrouching) return;
    if (nextCrouching) {
        crouching = true;
        player.y -= PLAYER_HEIGHT - CROUCH_HEIGHT;
    } else {
        const standingY = player.y + (PLAYER_HEIGHT - CROUCH_HEIGHT);
        if (collidesAt(player.x, standingY, player.z, PLAYER_HEIGHT)) {
            showMessage("Not enough room to stand");
            return;
        }
        player.y = standingY;
        crouching = false;
    }
    camera.position.set(player.x, player.y, player.z);
    sendMultiplayerState(performance.now());
}

function toggleCrouch() {
    setCrouching(!crouching);
}

window.addEventListener("beforeunload", disconnectMultiplayer);


// =====================================================
// THREE.JS SETUP
// =====================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 65, 175);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    260
);

camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

document.body.appendChild(renderer.domElement);

// =====================================================
// LIGHTING
// =====================================================

const ambientLight = new THREE.HemisphereLight(
    0xc7e6ff,
    0x62513c,
    2.0
);

scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0xfff3d7, 2.5);

sun.position.set(25, 40, 20);

sun.castShadow = true;

sun.shadow.mapSize.width = 1024;
sun.shadow.mapSize.height = 1024;

sun.shadow.camera.left = -80;
sun.shadow.camera.right = 80;
sun.shadow.camera.top = 80;
sun.shadow.camera.bottom = -80;

scene.add(sun);

// =====================================================
// SEEDED NOISE GENERATOR
// =====================================================

let randomSeed = 82471;

function createWorldSeed() {
    const values = new Uint32Array(1);

    if (globalThis.crypto && globalThis.crypto.getRandomValues) {
        globalThis.crypto.getRandomValues(values);
        return (values[0] % 2147483646) + 1;
    }

    return (Date.now() + Math.floor(Math.random() * 2147483646)) % 2147483646 + 1;
}

function seededRandom() {
    randomSeed = (randomSeed * 16807) % 2147483647;
    return (randomSeed - 1) / 2147483646;
}

function hash2D(x, z) {
    const n =
        Math.sin(x * 127.1 + z * 311.7 + 78.233 + randomSeed * 0.0001) *
        43758.5453123;

    return (n - Math.floor(n)) * 2 - 1;
}

function smooth(t) {
    return t * t * (3 - 2 * t);
}

function valueNoise(x, z) {
    const x0 = Math.floor(x);
    const z0 = Math.floor(z);

    const x1 = x0 + 1;
    const z1 = z0 + 1;

    const tx = smooth(x - x0);
    const tz = smooth(z - z0);

    const a = hash2D(x0, z0);
    const b = hash2D(x1, z0);
    const c = hash2D(x0, z1);
    const d = hash2D(x1, z1);

    const top = THREE.MathUtils.lerp(a, b, tx);
    const bottom = THREE.MathUtils.lerp(c, d, tx);

    return THREE.MathUtils.lerp(top, bottom, tz);
}

function fractalNoise(x, z) {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let amplitudeSum = 0;

    const octaves = 5;
    const persistence = 0.5;
    const lacunarity = 2.0;

    for (let i = 0; i < octaves; i++) {
        total += valueNoise(
            x * frequency,
            z * frequency
        ) * amplitude;

        amplitudeSum += amplitude;

        amplitude *= persistence;
        frequency *= lacunarity;
    }

    return total / amplitudeSum;
}

function terrainHeight(x, z) {
    const broad = fractalNoise(
        (x + 100) * 0.045,
        (z - 40) * 0.045
    );

    const medium = fractalNoise(
        (x - 50) * 0.105,
        (z + 80) * 0.105
    );

    const detail = fractalNoise(
        (x + 30) * 0.23,
        (z - 20) * 0.23
    );

    let height =
        8.5 +
        broad * 7.0 +
        medium * 3.0 +
        detail * 1.0;

    height = Math.round(height);

    return THREE.MathUtils.clamp(height, 2, 21);
}

// =====================================================
// VOXEL STORAGE
// =====================================================

function blockKey(x, y, z) {
    return `${x},${y},${z}`;
}

function getBlock(x, y, z) {
    return blocks.get(blockKey(x, y, z)) || 0;
}

function setBlock(x, y, z, type) {
    const key = blockKey(x, y, z);

    if (type === 0) {
        blocks.delete(key);
    } else {
        blocks.set(key, type);
    }
}

function isSolid(type) {
    return type === BLOCK_GRASS || type === BLOCK_DIRT ||
        type === BLOCK_WOOD || type === BLOCK_LEAVES;
}

function isInsideWorld(x, z) {
    return (
        x >= -HALF_WORLD &&
        x < HALF_WORLD &&
        z >= -HALF_WORLD &&
        z < HALF_WORLD
    );
}

// =====================================================
// TERRAIN GENERATION
// =====================================================

function generateWorld() {
    blocks.clear();

    for (let x = -HALF_WORLD; x < HALF_WORLD; x++) {
        for (let z = -HALF_WORLD; z < HALF_WORLD; z++) {

            const height = terrainHeight(x, z);

            for (let y = WORLD_BOTTOM; y <= height; y++) {

                if (y === height) {
                    setBlock(x, y, z, BLOCK_GRASS);
                } else {
                    setBlock(x, y, z, BLOCK_DIRT);
                }
            }

            for (let y = height + 1; y <= WATER_LEVEL; y++) {

                if (getBlock(x, y, z) === 0) {
                    setBlock(x, y, z, BLOCK_WATER);
                }
            }
        }
    }

    // Deterministic trees: the same world seed produces the same trees
    // for every player joining this shared world.
    for (let x = -HALF_WORLD + 3; x < HALF_WORLD - 3; x++) {
        for (let z = -HALF_WORLD + 3; z < HALF_WORLD - 3; z++) {
            const treeRoll = (Math.sin(x * 127.1 + z * 311.7 + randomSeed * 0.0001) * 43758.5453);
            const chance = treeRoll - Math.floor(treeRoll);
            if (chance > 0.006) continue;
            if (Math.abs(x) < 6 && Math.abs(z) < 6) continue;

            const groundY = terrainHeight(x, z);
            if (groundY <= WATER_LEVEL || getBlock(x, groundY, z) !== BLOCK_GRASS) continue;

            const trunkHeight = 4 + Math.floor(chance * 1000) % 2;
            for (let ty = 1; ty <= trunkHeight; ty++) {
                setBlock(x, groundY + ty, z, BLOCK_WOOD);
            }

            const crownY = groundY + trunkHeight;
            for (let lx = -2; lx <= 2; lx++) {
                for (let lz = -2; lz <= 2; lz++) {
                    for (let ly = -1; ly <= 2; ly++) {
                        const distance = Math.abs(lx) + Math.abs(lz) + Math.max(0, ly - 1);
                        if (distance > 4) continue;
                        const leafX = x + lx;
                        const leafY = crownY + ly;
                        const leafZ = z + lz;
                        if (getBlock(leafX, leafY, leafZ) === 0) {
                            setBlock(leafX, leafY, leafZ, BLOCK_LEAVES);
                        }
                    }
                }
            }
        }
    }

    let spawnHeight = terrainHeight(0, 0);

    player.x = 0.5;
    player.z = 0.5;
    player.y = spawnHeight + 1 + PLAYER_HEIGHT + 0.01;

    while (
        collidesAt(player.x, player.y, player.z) &&
        player.y < 40
    ) {
        player.y += 1;
    }

    camera.position.set(player.x, player.y, player.z);
}

// =====================================================
// MATERIALS
// =====================================================

const grassMaterial = new THREE.MeshStandardMaterial({
    color: 0x58b83f,
    roughness: 1.0
});

const dirtMaterial = new THREE.MeshStandardMaterial({
    color: 0x87532e,
    roughness: 1.0
});

const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x59351f,
    roughness: 1.0
});

const leavesMaterial = new THREE.MeshStandardMaterial({
    color: 0x26702b,
    roughness: 1.0
});

const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x269bd8,
    transparent: true,
    opacity: 0.43,
    roughness: 0.25,
    metalness: 0.0,
    depthWrite: false
});

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

// =====================================================
// CHUNKED EXPOSED-FACE VOXEL RENDERING
// =====================================================

const CHUNK_SIZE = 8;
const chunkMeshes = new Map();

const voxelFaces = [
    {
        normal: [1, 0, 0],
        neighbor: [1, 0, 0],
        vertices: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]]
    },
    {
        normal: [-1, 0, 0],
        neighbor: [-1, 0, 0],
        vertices: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]]
    },
    {
        normal: [0, 1, 0],
        neighbor: [0, 1, 0],
        vertices: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]]
    },
    {
        normal: [0, -1, 0],
        neighbor: [0, -1, 0],
        vertices: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]]
    },
    {
        normal: [0, 0, 1],
        neighbor: [0, 0, 1],
        vertices: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]]
    },
    {
        normal: [0, 0, -1],
        neighbor: [0, 0, -1],
        vertices: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]]
    }
];

function chunkKey(chunkX, chunkZ) {
    return `${chunkX},${chunkZ}`;
}

function disposeChunkMesh(chunkX, chunkZ) {
    const key = chunkKey(chunkX, chunkZ);
    const group = chunkMeshes.get(key);

    if (!group) return;

    scene.remove(group);

    for (const child of group.children) {
        child.geometry.dispose();
    }

    chunkMeshes.delete(key);
}

function addFaceToGeometry(data, x, y, z, face) {
    const order = [0, 1, 2, 0, 2, 3];

    for (const index of order) {
        const vertex = face.vertices[index];

        data.positions.push(
            x + vertex[0],
            y + vertex[1],
            z + vertex[2]
        );

        data.normals.push(
            face.normal[0],
            face.normal[1],
            face.normal[2]
        );
    }
}

function createChunkMaterialMesh(data, material, type) {
    if (data.positions.length === 0) return null;

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(data.positions, 3)
    );

    geometry.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(data.normals, 3)
    );

    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    const mesh = new THREE.Mesh(geometry, material);

    mesh.castShadow = type !== BLOCK_WATER;
    mesh.receiveShadow = type !== BLOCK_WATER;
    mesh.frustumCulled = true;

    return mesh;
}

function rebuildChunkMesh(chunkX, chunkZ) {
    disposeChunkMesh(chunkX, chunkZ);

    const grassData = { positions: [], normals: [] };
    const dirtData = { positions: [], normals: [] };
    const woodData = { positions: [], normals: [] };
    const leavesData = { positions: [], normals: [] };
    const waterData = { positions: [], normals: [] };

    const startX = chunkX * CHUNK_SIZE;
    const startZ = chunkZ * CHUNK_SIZE;
    const endX = startX + CHUNK_SIZE;
    const endZ = startZ + CHUNK_SIZE;

    for (let x = startX; x < endX; x++) {
        for (let z = startZ; z < endZ; z++) {
            for (let y = WORLD_BOTTOM; y <= 40; y++) {
                const type = getBlock(x, y, z);

                if (type === 0) continue;

                const data = type === BLOCK_GRASS
                    ? grassData
                    : type === BLOCK_DIRT
                        ? dirtData
                        : type === BLOCK_WOOD
                            ? woodData
                            : type === BLOCK_LEAVES
                                ? leavesData
                                : waterData;

                for (const face of voxelFaces) {
                    const neighborType = getBlock(
                        x + face.neighbor[0],
                        y + face.neighbor[1],
                        z + face.neighbor[2]
                    );

                    const faceIsVisible =
                        neighborType === 0 ||
                        (
                            type !== BLOCK_WATER &&
                            neighborType === BLOCK_WATER
                        );

                    if (faceIsVisible) {
                        addFaceToGeometry(data, x, y, z, face);
                    }
                }
            }
        }
    }

    const group = new THREE.Group();

    const grass = createChunkMaterialMesh(
        grassData, grassMaterial, BLOCK_GRASS
    );
    const dirt = createChunkMaterialMesh(
        dirtData, dirtMaterial, BLOCK_DIRT
    );
    const wood = createChunkMaterialMesh(
        woodData, woodMaterial, BLOCK_WOOD
    );
    const leaves = createChunkMaterialMesh(
        leavesData, leavesMaterial, BLOCK_LEAVES
    );
    const water = createChunkMaterialMesh(
        waterData, waterMaterial, BLOCK_WATER
    );

    if (grass) group.add(grass);
    if (dirt) group.add(dirt);
    if (wood) group.add(wood);
    if (leaves) group.add(leaves);
    if (water) group.add(water);

    if (group.children.length > 0) {
        scene.add(group);
        chunkMeshes.set(chunkKey(chunkX, chunkZ), group);
    }
}

function rebuildWorldMeshes() {
    for (const key of Array.from(chunkMeshes.keys())) {
        const [chunkX, chunkZ] = key.split(",").map(Number);
        disposeChunkMesh(chunkX, chunkZ);
    }

    const chunksToBuild = new Set();

    for (const key of blocks.keys()) {
        const [x, , z] = key.split(",").map(Number);
        chunksToBuild.add(chunkKey(
            Math.floor(x / CHUNK_SIZE),
            Math.floor(z / CHUNK_SIZE)
        ));
    }

    for (const key of chunksToBuild) {
        const [chunkX, chunkZ] = key.split(",").map(Number);
        rebuildChunkMesh(chunkX, chunkZ);
    }
}

function rebuildAffectedChunks(x, z) {
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkZ = Math.floor(z / CHUNK_SIZE);

    const localX = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const localZ = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

    const chunksToBuild = new Set([
        chunkKey(chunkX, chunkZ)
    ]);

    if (localX === 0) {
        chunksToBuild.add(chunkKey(chunkX - 1, chunkZ));
    } else if (localX === CHUNK_SIZE - 1) {
        chunksToBuild.add(chunkKey(chunkX + 1, chunkZ));
    }

    if (localZ === 0) {
        chunksToBuild.add(chunkKey(chunkX, chunkZ - 1));
    } else if (localZ === CHUNK_SIZE - 1) {
        chunksToBuild.add(chunkKey(chunkX, chunkZ + 1));
    }

    for (const key of chunksToBuild) {
        const [cx, cz] = key.split(",").map(Number);
        rebuildChunkMesh(cx, cz);
    }
}

// =====================================================
// PLAYER COLLISION
// =====================================================

function collidesAt(px, py, pz, height = getPlayerHeight()) {
    const minX = Math.floor(px - PLAYER_RADIUS);
    const maxX = Math.floor(px + PLAYER_RADIUS);

    const minY = Math.floor(py - height);
    const maxY = Math.floor(py + 0.12);

    const minZ = Math.floor(pz - PLAYER_RADIUS);
    const maxZ = Math.floor(pz + PLAYER_RADIUS);

    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            for (let z = minZ; z <= maxZ; z++) {

                if (isSolid(getBlock(x, y, z))) {

                    const overlapX =
                        px + PLAYER_RADIUS > x &&
                        px - PLAYER_RADIUS < x + 1;

                    const overlapY =
                        py > y &&
                        py - height < y + 1;

                    const overlapZ =
                        pz + PLAYER_RADIUS > z &&
                        pz - PLAYER_RADIUS < z + 1;

                    if (overlapX && overlapY && overlapZ) {
                        return true;
                    }
                }
            }
        }
    }

    return false;
}

function playerIntersectsBlock(x, y, z) {
    const overlapX =
        player.x + PLAYER_RADIUS > x &&
        player.x - PLAYER_RADIUS < x + 1;

    const overlapY =
        player.y > y &&
        player.y - getPlayerHeight() < y + 1;

    const overlapZ =
        player.z + PLAYER_RADIUS > z &&
        player.z - PLAYER_RADIUS < z + 1;

    return overlapX && overlapY && overlapZ;
}

// =====================================================
// MOVEMENT
// =====================================================

function hasCrouchSupport(px, pz) {
    const footY = player.y - CROUCH_HEIGHT;
    const supportY = Math.floor(footY - 0.06);
    const inset = PLAYER_RADIUS * 0.82;
    const samples = [
        [px, pz],
        [px - inset, pz - inset],
        [px + inset, pz - inset],
        [px - inset, pz + inset],
        [px + inset, pz + inset]
    ];
    return samples.every(([sx, sz]) => isSolid(getBlock(Math.floor(sx), supportY, Math.floor(sz))));
}

function movePlayer(delta) {
    const forwardInput =
        (keys["KeyW"] ? 1 : 0) -
        (keys["KeyS"] ? 1 : 0);

    const sideInput =
        (keys["KeyD"] ? 1 : 0) -
        (keys["KeyA"] ? 1 : 0);

    let dx = 0;
    let dz = 0;

    if (forwardInput !== 0 || sideInput !== 0) {

        const length = Math.hypot(
            forwardInput,
            sideInput
        );

        const forward = forwardInput / length;
        const side = sideInput / length;

        dx =
            -Math.sin(yaw) * forward +
            Math.cos(yaw) * side;

        dz =
            -Math.cos(yaw) * forward -
            Math.sin(yaw) * side;
    }

    const sprinting =
        keys["ShiftLeft"] || keys["ShiftRight"];

    const speed = sprinting ? SPRINT_SPEED : WALK_SPEED;

    const distance = speed * delta;

    const steps = Math.max(
        1,
        Math.ceil(distance / 0.2)
    );

    const stepX = dx * distance / steps;
    const stepZ = dz * distance / steps;

    for (let i = 0; i < steps; i++) {

        const nextX = player.x + stepX;

        if (!collidesAt(nextX, player.y, player.z) && (!crouching || hasCrouchSupport(nextX, player.z))) {
            player.x = nextX;
        }

        const nextZ = player.z + stepZ;

        if (!collidesAt(player.x, player.y, nextZ) && (!crouching || hasCrouchSupport(player.x, nextZ))) {
            player.z = nextZ;
        }
    }

    velocityY -= GRAVITY * delta;

    const nextY = player.y + velocityY * delta;

    if (!collidesAt(player.x, nextY, player.z)) {

        player.y = nextY;
        grounded = false;

    } else {

        if (velocityY < 0) {
            grounded = true;
        }

        velocityY = 0;
    }

    if (player.y < -15) {
        player.x = 0.5;
        player.z = 0.5;
        player.y = terrainHeight(0, 0) + 1 + PLAYER_HEIGHT + 0.01;

        velocityY = 0;
    }

    player.x = THREE.MathUtils.clamp(
        player.x,
        -HALF_WORLD + 0.35,
        HALF_WORLD - 0.35
    );

    player.z = THREE.MathUtils.clamp(
        player.z,
        -HALF_WORLD + 0.35,
        HALF_WORLD - 0.35
    );

    camera.position.set(player.x, player.y, player.z);

    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
}

function jump() {
    if (grounded) {
        velocityY = JUMP_SPEED;
        grounded = false;
    }
}

// =====================================================
// CAMERA CONTROLS
// =====================================================

const startScreen = document.getElementById("start-screen");
const startButton = document.getElementById("start-button");
const sensitivityInput = document.getElementById("camera-sensitivity");
const sensitivityValue = document.getElementById("camera-sensitivity-value");
startButton.textContent = "PLAY WORLD";

function requestGameplayPointerLock() {
    // Pointer lock is optional camera input only. A failed or unavailable
    // request must never prevent the game from entering the playing state.
    if (!renderer.domElement.requestPointerLock || document.pointerLockElement === renderer.domElement) {
        return;
    }
    try {
        const result = renderer.domElement.requestPointerLock();
        if (result && typeof result.catch === "function") result.catch(() => {});
    } catch (error) {
        // Arrow-key camera controls remain available without pointer lock.
    }
}

function pauseGame() {
    if (!gameStarted || gameOver || pauseState === "dead" || gamePaused) return;
    clearGameplayKeys();
    setPauseState("paused");
    // Release the cursor for pause-menu interaction. This is cleanup only;
    // the paused state above does not read or depend on pointer-lock status.
    if (document.pointerLockElement === renderer.domElement) {
        document.exitPointerLock();
    }
}

function resumeGame() {
    if (gameOver || pauseState === "dead" || !gamePaused) return;
    gameStarted = true;
    clearGameplayKeys();
    setPauseState("playing");
    requestGameplayPointerLock();
}

function togglePause() {
    if (!gameStarted || gameOver || pauseState === "dead") return;
    if (gamePaused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

function startGame() {
    if (gameOver || pauseState === "dead") return;
    if (!gameStarted) gameStarted = true;
    if (gamePaused) resumeGame();
    else requestGameplayPointerLock();
}

sensitivityInput.addEventListener("input", () => {
    cameraSensitivity = Number(sensitivityInput.value);
    sensitivityValue.textContent = `${cameraSensitivity.toFixed(1)}×`;
});

const crouchToggleSetting = document.getElementById("crouch-toggle-setting");
crouchToggleSetting.addEventListener("change", () => {
    crouchToggleMode = crouchToggleSetting.checked;
    if (!crouchToggleMode && crouching) setCrouching(false);
});

startButton.addEventListener("click", startGame);

// Pointer lock is used only to provide relative mouse movement. It never
// opens, closes, pauses, or resumes the game menu.

document.addEventListener("mousemove", event => {
    if (pauseState !== "playing" || document.pointerLockElement !== renderer.domElement) {
        return;
    }

    const sensitivity = 0.0022 * cameraSensitivity;
    yaw -= event.movementX * sensitivity;
    pitch -= event.movementY * sensitivity;
    pitch = THREE.MathUtils.clamp(
        pitch,
        -Math.PI / 2 + 0.01,
        Math.PI / 2 - 0.01
    );
});

// =====================================================
// INPUT AND BLOCK ACTIONS
// =====================================================

document.addEventListener("keydown", event => {
    const target = event.target;
    const typingIntoControl = target instanceof HTMLElement && (
        target.isContentEditable || target.tagName === "TEXTAREA" || target.tagName === "SELECT" ||
        (target.tagName === "INPUT" && !["range", "color", "button", "checkbox"].includes(target.type))
    );

    if (event.code === "KeyP" || event.code === "Escape") {
        if (!typingIntoControl && gameStarted && !event.repeat) {
            event.preventDefault();
            togglePause();
        }
        return;
    }

    if (event.code === "Space" || event.code.startsWith("Arrow")) {
        if (!(pauseState !== "playing" && target === sensitivityInput && event.code.startsWith("Arrow"))) {
            event.preventDefault();
        }
    }

    if (pauseState !== "playing" || gameOver || typingIntoControl) return;
    keys[event.code] = true;

    if (event.code === "Space") {
        jump();
        return;
    }

    if (event.repeat) return;

    const numberMatch = event.code.match(/^(?:Digit|Numpad)([1-9])$/);
    if (numberMatch) {
        selectHotbarSlot(Number(numberMatch[1]) - 1);
    } else if (event.code === "KeyN") {
        if (!punchPlayer()) breakBlock();
    } else if (event.code === "KeyM") {
        placeBlock();
    } else if (event.code === "KeyF") {
        punchPlayer();
    } else if (event.code === "KeyC") {
        if (crouchToggleMode) toggleCrouch();
        else setCrouching(true);
    }
});

document.addEventListener("keyup", event => {
    keys[event.code] = false;
    if (event.code === "KeyC" && !crouchToggleMode) setCrouching(false);
});

document.addEventListener("contextmenu", event => {
    event.preventDefault();
});

renderer.domElement.addEventListener("mousedown", event => {
    if (pauseState !== "playing" || gameOver) {
        return;
    }

    if (event.button === 0) {
        event.preventDefault();
        if (!punchPlayer()) breakBlock();
    } else if (event.button === 2) {
        placeBlock();
    }
});

// =====================================================
// VOXEL TARGETING
// =====================================================

function getTargetBlock() {
    camera.updateMatrixWorld(true);

    const origin = camera.position;
    const direction = new THREE.Vector3();

    camera.getWorldDirection(direction);
    direction.normalize();

    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX =
        direction.x > 0 ? 1 :
        direction.x < 0 ? -1 : 0;

    const stepY =
        direction.y > 0 ? 1 :
        direction.y < 0 ? -1 : 0;

    const stepZ =
        direction.z > 0 ? 1 :
        direction.z < 0 ? -1 : 0;

    const deltaX = stepX === 0
        ? Infinity
        : Math.abs(1 / direction.x);

    const deltaY = stepY === 0
        ? Infinity
        : Math.abs(1 / direction.y);

    const deltaZ = stepZ === 0
        ? Infinity
        : Math.abs(1 / direction.z);

    let maxX = stepX === 0
        ? Infinity
        : (
            stepX > 0
                ? x + 1 - origin.x
                : origin.x - x
        ) / Math.abs(direction.x);

    let maxY = stepY === 0
        ? Infinity
        : (
            stepY > 0
                ? y + 1 - origin.y
                : origin.y - y
        ) / Math.abs(direction.y);

    let maxZ = stepZ === 0
        ? Infinity
        : (
            stepZ > 0
                ? z + 1 - origin.z
                : origin.z - z
        ) / Math.abs(direction.z);

    let distance = 0;

    const normal = new THREE.Vector3(0, 0, 0);

    while (distance <= REACH_DISTANCE) {

        const type = getBlock(x, y, z);

        if (isSolid(type)) {
            return {
                x,
                y,
                z,
                type,
                normal: normal.clone(),
                distance
            };
        }

        if (maxX <= maxY && maxX <= maxZ) {

            distance = maxX;

            if (!Number.isFinite(distance)) {
                break;
            }

            maxX += deltaX;
            x += stepX;

            normal.set(-stepX, 0, 0);

        } else if (maxY <= maxX && maxY <= maxZ) {

            distance = maxY;

            if (!Number.isFinite(distance)) {
                break;
            }

            maxY += deltaY;
            y += stepY;

            normal.set(0, -stepY, 0);

        } else {

            distance = maxZ;

            if (!Number.isFinite(distance)) {
                break;
            }

            maxZ += deltaZ;
            z += stepZ;

            normal.set(0, 0, -stepZ);
        }
    }

    return null;
}

// =====================================================
// INVENTORY AND BLOCK SELECTION
// =====================================================

let lastMessageTime = 0;

function showMessage(text) {
    document.getElementById("message").textContent = text;
    lastMessageTime = performance.now();
}

function selectBlock(type) {
    if (![BLOCK_GRASS, BLOCK_DIRT, BLOCK_WOOD, BLOCK_LEAVES].includes(type)) {
        return;
    }

    selectedBlock = type;

    updateHUD();

    showMessage(
        blockName(type) === "grass" ? "Selected grass" : "Selected " + blockName(type)
    );
}


function blockName(type) {
    return type === BLOCK_GRASS ? "grass" :
        type === BLOCK_DIRT ? "dirt" :
        type === BLOCK_WOOD ? "wood" : "leaves";
}

function inventoryCount(type) {
    return type === BLOCK_GRASS ? grassInventory :
        type === BLOCK_DIRT ? dirtInventory :
        type === BLOCK_WOOD ? woodInventory :
        type === BLOCK_LEAVES ? leavesInventory : 0;
}

function setInventoryCount(type, amount) {
    if (type === BLOCK_GRASS) {
        grassInventory = amount;
    } else if (type === BLOCK_DIRT) {
        dirtInventory = amount;
    } else if (type === BLOCK_WOOD) {
        woodInventory = amount;
    } else if (type === BLOCK_LEAVES) {
        leavesInventory = amount;
    }
}

function addInventory(type) {
    const previousCount = inventoryCount(type);

    if (previousCount <= 0 && !hotbar.includes(type)) {
        hotbar.push(type);
    }

    setInventoryCount(type, previousCount + 1);

    if (selectedBlock !== type && hotbar.length === 1) {
        selectedBlock = type;
    }

    updateHUD();
}

function removeInventory(type) {
    const nextCount = inventoryCount(type) - 1;
    setInventoryCount(type, Math.max(0, nextCount));

    if (nextCount <= 0) {
        const index = hotbar.indexOf(type);

        if (index !== -1) {
            hotbar.splice(index, 1);
        }

        if (selectedBlock === type) {
            selectedBlock = hotbar.length > 0
                ? hotbar[0]
                : BLOCK_GRASS;
        }
    }

    updateHUD();
}

function selectHotbarSlot(index) {
    if (index < 0 || index >= 9) return;

    const type = hotbar[index];

    if (type === undefined) {
        showMessage("That hotbar slot is empty");
        return;
    }

    selectedBlock = type;
    updateHUD();

    showMessage(
        "Selected " + blockName(type)
    );
}

function renderHotbar() {
    const hotbarElement = document.getElementById("hotbar");
    hotbarElement.innerHTML = "";

    for (let i = 0; i < 9; i++) {
        const type = hotbar[i];
        const slot = document.createElement("div");

        slot.className = "hotbar-slot";

        if (type !== undefined && type === selectedBlock) {
            slot.classList.add("selected");
        }

        const number = document.createElement("span");
        number.className = "hotbar-number";
        number.textContent = i + 1;
        slot.appendChild(number);

        if (type !== undefined) {
            const icon = document.createElement("div");
            icon.className = "hotbar-icon " + blockName(type);
            slot.appendChild(icon);

            const count = document.createElement("span");
            count.className = "hotbar-count";
            count.textContent = inventoryCount(type);
            slot.appendChild(count);
        }

        hotbarElement.appendChild(slot);
    }
}

// =====================================================
// WATER SPREADING
// =====================================================

// Each water block updates after a short delay. Newly created water blocks
// are added to the same queue so the water continues spreading in stages.
const WATER_SPREAD_DELAY = 350;
const waterUpdateQueue = [];
const waterUpdatesQueued = new Set();
let waterUpdateTimer = null;

function scheduleWaterUpdate(x, y, z) {
    if (getBlock(x, y, z) !== BLOCK_WATER) return;

    const key = blockKey(x, y, z);
    if (waterUpdatesQueued.has(key)) return;

    waterUpdatesQueued.add(key);
    waterUpdateQueue.push([x, y, z]);

    if (waterUpdateTimer === null) {
        waterUpdateTimer = setTimeout(processNextWaterUpdate, WATER_SPREAD_DELAY);
    }
}

function rebuildWaterChunksForPositions(positions) {
    const chunksToBuild = new Set();

    for (const [x, , z] of positions) {
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkZ = Math.floor(z / CHUNK_SIZE);
        const localX = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const localZ = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

        chunksToBuild.add(chunkKey(chunkX, chunkZ));
        if (localX === 0) chunksToBuild.add(chunkKey(chunkX - 1, chunkZ));
        else if (localX === CHUNK_SIZE - 1) chunksToBuild.add(chunkKey(chunkX + 1, chunkZ));
        if (localZ === 0) chunksToBuild.add(chunkKey(chunkX, chunkZ - 1));
        else if (localZ === CHUNK_SIZE - 1) chunksToBuild.add(chunkKey(chunkX, chunkZ + 1));
    }

    for (const key of chunksToBuild) {
        const [chunkX, chunkZ] = key.split(',').map(Number);
        rebuildChunkMesh(chunkX, chunkZ);
    }
}

function processNextWaterUpdate() {
    waterUpdateTimer = null;
    const source = waterUpdateQueue.shift();
    if (!source) return;

    const [sourceX, sourceY, sourceZ] = source;
    const sourceKey = blockKey(sourceX, sourceY, sourceZ);
    waterUpdatesQueued.delete(sourceKey);

    if (getBlock(sourceX, sourceY, sourceZ) === BLOCK_WATER) {
        // Water spreads horizontally and downward into air, never upward.
        const spreadOffsets = [
            [1, 0, 0], [-1, 0, 0],
            [0, 0, 1], [0, 0, -1], [0, -1, 0]
        ];
        const newlySpread = [];

        for (const [dx, dy, dz] of spreadOffsets) {
            const targetX = sourceX + dx;
            const targetY = sourceY + dy;
            const targetZ = sourceZ + dz;

            if (targetY < WORLD_BOTTOM || targetY > 40 || !isInsideWorld(targetX, targetZ)) continue;
            if (getBlock(targetX, targetY, targetZ) !== 0) continue;

            setBlock(targetX, targetY, targetZ, BLOCK_WATER);
            sendBlockEdit(targetX, targetY, targetZ, BLOCK_WATER);
            newlySpread.push([targetX, targetY, targetZ]);
        }

        if (newlySpread.length > 0) {
            rebuildWaterChunksForPositions(newlySpread);

            // Every new water block gets its own delayed update, allowing
            // the water to continue spreading outward in successive waves.
            for (const [x, y, z] of newlySpread) {
                scheduleWaterUpdate(x, y, z);
            }
        }
    }

    // Process queued water blocks one at a time, with a delay between updates.
    if (waterUpdateQueue.length > 0 && waterUpdateTimer === null) {
        waterUpdateTimer = setTimeout(processNextWaterUpdate, WATER_SPREAD_DELAY);
    }
}

function spreadWaterFromAdjacentBlocks(x, y, z) {
    const sourceOffsets = [
        [1, 0, 0], [-1, 0, 0], [0, 1, 0],
        [0, 0, 1], [0, 0, -1], [0, -1, 0]
    ];

    for (const [dx, dy, dz] of sourceOffsets) {
        const waterX = x + dx;
        const waterY = y + dy;
        const waterZ = z + dz;
        if (getBlock(waterX, waterY, waterZ) === BLOCK_WATER) {
            scheduleWaterUpdate(waterX, waterY, waterZ);
        }
    }
}

// =====================================================
// BREAKING BLOCKS
// =====================================================

function breakBlock() {
    if (!gameStarted) {
        return;
    }

    const target = getTargetBlock();

    if (!target) {
        showMessage("Aim at a block within 4 voxels");
        return;
    }

    const { x, y, z, type } = target;

    if (![BLOCK_GRASS, BLOCK_DIRT, BLOCK_WOOD, BLOCK_LEAVES].includes(type)) {
        return;
    }

    addInventory(type);
    setBlock(x, y, z, 0);
    sendBlockEdit(x, y, z, 0);
    spreadWaterFromAdjacentBlocks(x, y, z);

    rebuildAffectedChunks(x, z);
    updateHUD();

    showMessage(blockName(type).charAt(0).toUpperCase() + blockName(type).slice(1) + " collected");
}

// =====================================================
// PLACING BLOCKS
// =====================================================

function placeBlock() {
    if (!gameStarted) {
        return;
    }

    const target = getTargetBlock();

    if (!target) {
        showMessage("Aim at a block within 4 voxels");
        return;
    }

    // Place the new voxel in the cell immediately outside
    // the face of the block hit by the targeting ray.
    const x = target.x + target.normal.x;
    const y = target.y + target.normal.y;
    const z = target.z + target.normal.z;

    if (
        !isInsideWorld(x, z) ||
        y < WORLD_BOTTOM ||
        y > 40
    ) {
        showMessage("Cannot place outside the world");
        return;
    }

    const existing = getBlock(x, y, z);

    if (isSolid(existing)) {
        showMessage("That space is occupied");
        return;
    }

    if (playerIntersectsBlock(x, y, z)) {
        showMessage("Cannot place a block inside yourself");
        return;
    }

    // Check inventory before changing the world.
    if (
        selectedBlock === BLOCK_GRASS &&
        grassInventory <= 0
    ) {
        showMessage("No grass blocks in inventory");
        return;
    }

    if (inventoryCount(selectedBlock) <= 0) {
        showMessage("No " + blockName(selectedBlock) + " blocks in inventory");
        return;
    }

    const placedType = selectedBlock;

    setBlock(x, y, z, placedType);
    sendBlockEdit(x, y, z, placedType);

    removeInventory(placedType);

    rebuildAffectedChunks(x, z);
    updateHUD();

    showMessage(blockName(placedType).charAt(0).toUpperCase() + blockName(placedType).slice(1) + " placed");
}

// =====================================================
// HUD
// =====================================================

function updateHUD() {
    document.getElementById("water-level").textContent =
        WATER_LEVEL;

    document.getElementById("position").textContent =
        `${Math.floor(player.x)}, ${Math.floor(player.y)}, ${Math.floor(player.z)}`;

    renderHotbar();
}

// =====================================================
// INITIALIZE
// =====================================================

// A fresh seed creates a different procedural noise map on every page load.
randomSeed = createWorldSeed();
generateWorld();
rebuildWorldMeshes();
updateHUD();
updateHealthDisplay();
updateOnlinePlayerCount();

// =====================================================
// GAME LOOP
// =====================================================

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    if (gameStarted && !gamePaused && !gameOver) {
        if (keys["Space"] && grounded) jump();
        movePlayer(delta);

        if (!multiplayerReady && health < 20) {
            healthRegenElapsed += delta;
            while (healthRegenElapsed >= 4 && health < 20) {
                healthRegenElapsed -= 4;
                health = Math.min(20, health + 1);
                updateHealthDisplay();
            }
        }

        const cameraTurnSpeed = 1.8 * cameraSensitivity;
        const cameraLookSpeed = 1.5 * cameraSensitivity;

        if (keys["ArrowLeft"]) {
            yaw += cameraTurnSpeed * delta;
        }

        if (keys["ArrowRight"]) {
            yaw -= cameraTurnSpeed * delta;
        }

        if (keys["ArrowUp"]) {
            pitch += cameraLookSpeed * delta;
        }

        if (keys["ArrowDown"]) {
            pitch -= cameraLookSpeed * delta;
        }

        pitch = THREE.MathUtils.clamp(
            pitch,
            -Math.PI / 2 + 0.01,
            Math.PI / 2 - 0.01
        );

        camera.rotation.y = yaw;
        camera.rotation.x = pitch;

        updateHUD();
        sendMultiplayerState(performance.now());
    }

    updateRemotePlayers(delta);

    if (performance.now() - lastMessageTime > 2200) {
        document.getElementById("message").textContent = "";
    }

    renderer.render(scene, camera);
}

animate();

// =====================================================
// RESIZE
// =====================================================

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});

</script>
</body>
</html>


