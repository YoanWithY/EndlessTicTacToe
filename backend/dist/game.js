"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genGame = exports.games = exports.shapes = exports.Player = void 0;
const WebSocket = require("ws");
class Player {
    constructor(webSocket, playerName, playerNumber) {
        this.ready = false;
        this.webSocket = webSocket;
        this.name = playerName;
        this.playerNumber = playerNumber;
        this.color = playerNumber;
        this.shape = "none";
    }
    update(playerData) {
        this.name = playerData.name;
        this.shape = playerData.shape;
        this.color = playerData.color;
        this.ready = playerData.isPlayerRead;
        this.playerNumber = this.playerNumber;
    }
}
exports.Player = Player;
exports.shapes = ["square_filled", "circle_filled", "triangle_filled", "cross", "square", "circle", "triangle"];
class Game {
    constructor(gameID, movesPerTurn, playerCount, winCondition) {
        this.availableShapes = new Set(exports.shapes);
        this.players = [];
        this.webSocketServer = new WebSocket.Server({ noServer: true });
        this.gameID = gameID;
        this.movesPerTurn = movesPerTurn;
        this.playerCount = playerCount;
        this.winCondition = winCondition;
        for (let i = 0; i < playerCount; i++)
            this.players[i] = undefined;
    }
    getFirstAvailablePlayerNumber() {
        for (let i = 0; i < this.playerCount; i++) {
            if (this.players[i] === undefined) {
                this.players[i] === null;
                return i;
            }
        }
        return undefined;
    }
    /**
     * Migrates the ownership of a shape name from the available set to a Player.
     * @param shape The shape name that should be migrated.
     * @param player The player to migrate the Shape to.
     * @returns Wether the migration was succesfull or not.
     */
    migrateShape(shape, player) {
        if (!this.availableShapes.has(shape))
            return false;
        this.availableShapes.delete(shape);
        player.shape = shape;
        return true;
    }
    giveBackShape(shape) {
        this.availableShapes.add(shape);
    }
    getAllPlayerData() {
        const d = [];
        for (let i = 0; i < this.playerCount; i++) {
            const p = this.players[i];
            d[i] = p ? { name: p.name, color: p.color, shape: p.shape, playerNumber: i, isPlayerRead: p.ready } : d[i] = { name: "-", color: 0, shape: "none", playerNumber: i, isPlayerRead: false };
        }
        return d;
    }
}
exports.default = Game;
exports.games = new Map();
function genGame(movesPerTurn, playerCount, winCondition) {
    const mod = 10000;
    let attempt = Date.now() % mod;
    while (exports.games.has(attempt)) {
        attempt = Date.now() % mod;
    }
    const game = new Game(attempt, movesPerTurn, playerCount, winCondition);
    exports.games.set(attempt, game);
    return game;
}
exports.genGame = genGame;
