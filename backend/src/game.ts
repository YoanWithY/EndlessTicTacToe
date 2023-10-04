import * as WebSocket from "ws";

export class Player {
    webSocket: WebSocket;
    name: string;
    color: ws_color;
    shape: ws_player_shape;
    playerNumber: number;
    ready = false;
    constructor(webSocket: WebSocket, playerName: string, playerNumber: number) {
        this.webSocket = webSocket;
        this.name = playerName;
        this.playerNumber = playerNumber;
        this.color = playerNumber as ws_color;
        this.shape = "none";
    }
}

export const shapes: ws_player_shape[] = ["square_filled", "circle_filled", "triangle_filled", "cross", "square", "circle", "triangle"];
export default class Game {
    availableShapes: Set<ws_player_shape> = new Set(shapes);
    gameID: number;
    movesPerTurn: number;
    playerCount: number;
    winCondition: number;
    players: (Player | undefined)[] = [];
    webSocketServer = new WebSocket.Server({ noServer: true });
    constructor(gameID: number, movesPerTurn: number, playerCount: number, winCondition: number) {
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
    migrateShape(shape: ws_player_shape, player: Player) {
        if (!this.availableShapes.has(shape))
            return false;

        this.availableShapes.delete(shape);
        player.shape = shape;
        return true;
    }

    getAllPlayerData() {
        const d: ws_player_data[] = [];
        for (let i = 0; i < this.playerCount; i++) {
            const p = this.players[i];
            d[i] = p ? { name: p.name, color: p.color, shape: p.shape, playerNumber: i, isPlayerRead: p.ready } : d[i] = { name: "-", color: 0, shape: "none", playerNumber: i, isPlayerRead: false };
        }
        return d;
    }
}

export const games = new Map<number, Game>();

export function genGame(movesPerTurn: number, playerCount: number, winCondition: number): Game {
    const mod = 10000;
    let attempt = Date.now() % mod;
    while (games.has(attempt)) {
        attempt = Date.now() % mod;
    }
    const game = new Game(attempt, movesPerTurn, playerCount, winCondition);
    games.set(attempt, game);
    return game;
}