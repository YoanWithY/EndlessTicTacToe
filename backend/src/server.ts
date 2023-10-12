/// <reference path="../../shared/types.d.ts" />
import * as http from 'http';
import * as fs from "fs";
import * as path from "path";
import * as WebSocket from 'ws';
import * as net from 'net'
import { games, genGame } from './game';
import { bodyAsObject } from './bodyParse';

type Response = http.ServerResponse<http.IncomingMessage> & {
    req: http.IncomingMessage
};

function rootPath(p: string) {
    return path.normalize(__dirname + "/../../" + p);
}

function getContentTypeFromPath(path: string) {
    if (path.endsWith(".html"))
        return "text/html";

    if (path.endsWith(".svg"))
        return "image/svg+xml";

    if (path.endsWith(".css"))
        return "text/css";

    if (path.endsWith(".js"))
        return "text/javascript";

    return "text/plain";
}

function servFile(response: Response, path?: string) {
    if (!path)
        return;
    try {
        const type = getContentTypeFromPath(path);
        const file = fs.readFileSync(rootPath(path));
        response.setHeader("Cache-Control", "no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Expires", "0");
        response.writeHead(200, { "Content-Type": type });
        response.end(file);
    } catch (err) {
        console.error(err);
        response.writeHead(500, { "Content-Type": "text/plain" });
        response.end("Error trying to serve a file.");
    }
}

/**
 * A utility function that serves a typed object as JSON.
 * @param response The response object.
 * @param data The data object to serv as JSON.
 */
function servJson<T>(response: Response, data: T) {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(data));
}

function badRequest(response: Response, url: string | undefined) {
    response.writeHead(400, { 'Content-Type': 'text/plain' });
    response.end(`400 - ${url} is a bad request.`);
}

const httpFunctions: { [key: string]: (reques: http.IncomingMessage, response: Response, urlArr: string[]) => void } = {
    async doesGameExist(request: http.IncomingMessage, response: Response) {
        if (request.method !== 'PUT') {
            badRequest(response, request.url);
            return;
        }

        const data = await bodyAsObject<req_doesGameExist>(request);
        servJson<res_doesGameExist>(response, { exists: games.has(data.gameID) });
    },
    async newGame(request: http.IncomingMessage, response: Response) {
        if (request.method !== 'POST') {
            badRequest(response, request.url);
            return;
        }

        const data = await bodyAsObject<req_newGame>(request);
        const game = genGame(data.movesPerTurn, data.playerCount, data.winCondition);
        console.log(`Created new game with ID: ${game.gameID} and ${game.playerCount} players.`);
        servJson<res_newGame>(response, { gameID: game.gameID });
    },
    async game(request: http.IncomingMessage, response: Response, urlArr: string[]) {
        if (urlArr.length <= 1 || urlArr[1] == "") {
            response.writeHead(301, { 'Location': '/' });
            response.end();
            return;
        }

        const num = Number.parseInt(urlArr[1]);
        if (isNaN(num)) {
            servFile(response, request.url);
            return;
        }
        servFile(response, "game/game.html");
    }
}

function httpHandling(request: http.IncomingMessage, response: Response) {
    const url = request.url;
    if (!url || url === "") {
        response.writeHead(400, { 'Content-Type': 'text/plain' });
        response.end(`400 - ${URL} is a bad request.`);
        return;
    }

    if (url === "/") {
        servFile(response, "/index.html");
        return;
    }

    const urlArr = url.split("/").slice(1);
    const fun = httpFunctions[urlArr[0]];
    if (fun) {
        fun(request, response, urlArr);
        return;
    }

    servFile(response, request.url);
}

function httpUpgradeHandling(request: http.IncomingMessage, socket: net.Socket, head: Buffer) {
    const urlString = request.url;

    if (!urlString) {
        socket.destroy();
        console.log("Game does not Exist.");
        return;
    }

    const match = urlString.match(/\d+/g);
    if (!match || match.length === 0) {
        socket.destroy();
        return;
    }

    const gameID = Number(match[0]);
    const game = games.get(gameID);
    if (!game) {
        socket.destroy();
        return;
    }

    game.webSocketServer.handleUpgrade(request, socket, head, (webSocket: WebSocket, request: http.IncomingMessage) => {
        const playerNumber = game.getFirstAvailablePlayerNumber();
        if (playerNumber === undefined) {
            const res: ws_close_connection_reject = "serverIsFull";
            webSocket.close(1000, res);
            return
        }

        const player = game.players[playerNumber];
        player.status = "online";

        const wsFunctions: { [key: string]: (data: any) => void } = {
            updatePlayerData(data: ws_req_update_player_data) {
                const playerData = data.player;
                const player = game.players[playerData.playerNumber];
                if (!player)
                    return;
                player.update(playerData);
                game.webSocketServer.clients.forEach((client: WebSocket) => {
                    if (client !== webSocket) {
                        const res: ws_res_update_player_data = data;
                        client.send(JSON.stringify(res));
                    }
                });
            },
            playerReady(data: ws_req_player_ready) {
                if (game.isRunning) {
                    // join the game later scenario.
                    const data: ws_res_join_game = { command: "joinGame", game: game.getWSData() };
                    webSocket.send(JSON.stringify(data));
                    return;
                }

                // first start of the game scenario.
                const players = game.players;
                for (const p of players)
                    if (p.status !== "ready")
                        return;

                game.isRunning = true;
                game.webSocketServer.clients.forEach((client: WebSocket) => {
                    const data: ws_start_game = { command: "startGame" };
                    client.send(JSON.stringify(data));
                });
            },
            newChip(data: ws_req_new_chip) {
                game.addChip(data.chip);
                game.webSocketServer.clients.forEach((client: WebSocket) => {
                    if (client !== webSocket) {
                        const res: ws_res_new_chip = data;
                        client.send(JSON.stringify(res));
                    }
                });
            },
            newBoundary(data: ws_req_new_boundary) {
                game.addBoundary();
            },
            pong() {
                lastPong = Date.now();
            }
        };

        webSocket.on("message", msg => {
            const data = JSON.parse(String(msg)) as ettt;
            if (!(data.command))
                console.error("No ettt");

            const fun = wsFunctions[data.command];
            if (fun)
                fun(data);
        });

        const close = () => {
            player.status = "offline";
            const data: ws_req_update_player_data = { command: "updatePlayerData", player: player };
            wsFunctions.updatePlayerData(data);
        }

        let lastPong: number;
        let timerID: NodeJS.Timeout;
        const ping = () => {
            const data: ws_ping = { command: "ping" };
            webSocket.send(JSON.stringify(data));

            const dt = Date.now() - lastPong;
            if (dt > 3000) {
                webSocket.close(1001, "heartbeatTimeout");
                console.log("Close because of heartbeat timeout.");
                close();
            }
            else
                timerID = setTimeout(ping, 1000);
        };

        const res: ws_res_connection_as_player = { command: "connectAsPlayer", playerData: game.getAllPlayerData(), playerNumber: playerNumber, cdfw: game.winCondition, movesInRow: game.movesInRow };
        webSocket.send(JSON.stringify(res));
        const updateData: ws_res_update_player_data = { command: "updatePlayerData", player: { playerNumber: playerNumber, name: player.name, color: player.color, status: player.status, shape: player.shape } };
        wsFunctions.updatePlayerData(updateData);

        lastPong = Date.now();
        ping();

        webSocket.on("close", (code, reason) => {
            clearTimeout(timerID);
            console.log(`Game ${gameID}: Player ${playerNumber} closed connection.`);
            close();
        });
    });
}

const server = http.createServer(httpHandling);
server.on('upgrade', httpUpgradeHandling);

const port = process.env.PORT || 3000;
server.listen(port);

console.log(`Server running at http://localhost:${port}`);