"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genGame = exports.games = exports.shapes = exports.Player = void 0;
const WebSocket = require("ws");
class Player {
    constructor(playerNumber) {
        this.status = "offline";
        this.name = `Player ${playerNumber + 1}`;
        this.playerNumber = playerNumber;
        this.color = playerNumber;
        this.shape = "none";
    }
    update(playerData) {
        this.name = playerData.name;
        this.shape = playerData.shape;
        this.color = playerData.color;
        this.status = playerData.status;
        this.playerNumber = this.playerNumber;
    }
}
exports.Player = Player;
exports.shapes = ["square_filled", "circle_filled", "triangle_filled", "cross", "square", "circle", "triangle"];
class Game {
    constructor(gameID, movesInRow, playerCount, winCondition) {
        this.availableShapes = new Set(exports.shapes);
        this.players = [];
        this.chips = [];
        this.activePlayer = 0;
        this.chipsPlaced = 0;
        this.boundaries = [];
        this.webSocketServer = new WebSocket.Server({ noServer: true });
        this.isRunning = false;
        this.gameID = gameID;
        this.movesInRow = movesInRow;
        this.playerCount = playerCount;
        this.winCondition = winCondition;
        for (let i = 0; i < playerCount; i++) {
            this.players[i] = new Player(i);
            for (const s of this.availableShapes) {
                if (this.migrateShape(s, this.players[i]))
                    break;
            }
        }
        this.addChip({ x: 0, y: 0, owner: 0 });
    }
    getWSData() {
        return { boundaries: this.boundaries, chips: this.chips, activePlayer: this.activePlayer, chipsPlaced: this.chipsPlaced };
    }
    addBoundary() {
        this.boundaries.push({ chips: this.chips });
        this.chips = [];
    }
    addChip(chip) {
        this.chips.push(chip);
        this.chipsPlaced++;
        if (this.chipsPlaced === this.movesInRow) {
            this.activePlayer = (this.activePlayer + 1) % this.players.length;
            this.chipsPlaced = 0;
        }
    }
    getFirstAvailablePlayerNumber() {
        for (let i = 0; i < this.playerCount; i++)
            if (this.players[i].status === "offline")
                return i;
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
            d[i] = { name: p.name, color: p.color, shape: p.shape, playerNumber: i, status: p.status };
        }
        return d;
    }
}
exports.default = Game;
exports.games = new Map();
function genGame(movesPerTurn, playerCount, winCondition) {
    let i = 110;
    while (exports.games.has(i))
        i++;
    const game = new Game(i, movesPerTurn, playerCount, winCondition);
    exports.games.set(i, game);
    const destroy = setInterval(() => {
        // check if any player is leaft
        for (const p of game.players)
            if (p.status !== "offline")
                return;
        clearInterval(destroy);
        // if not close the game
        game.webSocketServer.clients.forEach(ws => {
            ws.close();
        });
        game.webSocketServer.close();
        exports.games.delete(game.gameID);
        console.log(`Terminated Game: ${game.gameID}`);
    }, 100000);
    return game;
}
exports.genGame = genGame;
