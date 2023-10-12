import * as WebSocket from "ws";

export class Player {
    webSocket?: WebSocket;
    name: string;
    color: ws_color;
    shape: ws_player_shape;
    playerNumber: number;
    status: ws_player_status = "offline";
    constructor(playerNumber: number) {
        this.name = `Player ${playerNumber + 1}`;
        this.playerNumber = playerNumber;
        this.color = playerNumber as ws_color;
        this.shape = "none";
    }

    update(playerData: ws_player_data) {
        this.name = playerData.name;
        this.shape = playerData.shape;
        this.color = playerData.color;
        this.status = playerData.status;
        this.playerNumber = this.playerNumber;
    }
}

export const shapes: ws_player_shape[] = ["square_filled", "circle_filled", "triangle_filled", "cross", "square", "circle", "triangle"];
export default class Game {
    availableShapes: Set<ws_player_shape> = new Set(shapes);
    gameID: number;
    movesInRow: ws_move_in_row;
    playerCount: number;
    winCondition: ws_cnfw;
    players: Player[] = [];
    private chips: ws_chip[] = [];
    activePlayer = 0;
    chipsPlaced = 0;
    boundaries: ws_boundary[] = [];
    webSocketServer = new WebSocket.Server({ noServer: true });
    isRunning = false;
    constructor(gameID: number, movesInRow: ws_move_in_row, playerCount: number, winCondition: ws_cnfw) {
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
    getWSData(): ws_game {
        return { boundaries: this.boundaries, chips: this.chips, activePlayer: this.activePlayer, chipsPlaced: this.chipsPlaced };
    }
    addBoundary() {
        this.boundaries.push({ chips: this.chips });
        this.chips = [];
    }
    addChip(chip: ws_chip) {
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
    migrateShape(shape: ws_player_shape, player: Player) {
        if (!this.availableShapes.has(shape))
            return false;

        this.availableShapes.delete(shape);
        player.shape = shape;
        return true;
    }

    giveBackShape(shape: ws_player_shape) {
        this.availableShapes.add(shape);
    }

    getAllPlayerData() {
        const d: ws_player_data[] = [];
        for (let i = 0; i < this.playerCount; i++) {
            const p = this.players[i];
            d[i] = { name: p.name, color: p.color, shape: p.shape, playerNumber: i, status: p.status };
        }
        return d;
    }
}

export const games = new Map<number, Game>();

export function genGame(movesPerTurn: ws_move_in_row, playerCount: number, winCondition: ws_cnfw): Game {
    let i = 0;
    while (games.has(i)) i++;
    const game = new Game(i, movesPerTurn, playerCount, winCondition);
    games.set(i, game);

    const destroy = setInterval(() => {
        // check if any player is leaft
        for (const p of game.players)
            if (p.status !== "offline")
                return;

        clearInterval(destroy);
        // if not close the game
        game.webSocketServer.clients.forEach(ws => {
            ws.close();
        })
        game.webSocketServer.close();
        games.delete(game.gameID);
        console.log(`Terminated Game: ${game.gameID}`);
    }, 100000);
    return game;
}