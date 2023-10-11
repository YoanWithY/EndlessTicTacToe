"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="../../shared/types.d.ts" />
const http = require("http");
const fs = require("fs");
const path = require("path");
const game_1 = require("./game");
const bodyParse_1 = require("./bodyParse");
function rootPath(p) {
    return path.normalize(__dirname + "/../../" + p);
}
function getContentTypeFromPath(path) {
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
function servFile(response, path) {
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
    }
    catch (err) {
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
function servJson(response, data) {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(data));
}
function badRequest(response, url) {
    response.writeHead(400, { 'Content-Type': 'text/plain' });
    response.end(`400 - ${url} is a bad request.`);
}
const httpFunctions = {
    async doesGameExist(request, response) {
        if (request.method !== 'PUT') {
            badRequest(response, request.url);
            return;
        }
        const data = await (0, bodyParse_1.bodyAsObject)(request);
        servJson(response, { exists: game_1.games.has(data.gameID) });
    },
    async newGame(request, response) {
        if (request.method !== 'POST') {
            badRequest(response, request.url);
            return;
        }
        const data = await (0, bodyParse_1.bodyAsObject)(request);
        const game = (0, game_1.genGame)(data.movesPerTurn, data.playerCount, data.winCondition);
        game_1.games.set(game.gameID, game);
        console.log(`Created new game with ID: ${game.gameID} and ${game.playerCount} players.`);
        servJson(response, { gameID: game.gameID });
    },
    async game(request, response, urlArr) {
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
        const game = game_1.games.get(num);
        if (!game) {
            console.log(`The game ID ${num} is unknown.`);
            response.writeHead(301, { 'Location': '/' });
            response.end();
            return;
        }
        servFile(response, "game/game.html");
    }
};
function httpHandling(request, response) {
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
function httpUpgradeHandling(request, socket, head) {
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
    const game = game_1.games.get(gameID);
    if (!game) {
        socket.destroy();
        return;
    }
    game.webSocketServer.handleUpgrade(request, socket, head, (webSocket, request) => {
        const playerNumber = game.getFirstAvailablePlayerNumber();
        if (playerNumber === undefined) {
            const res = "serverIsFull";
            webSocket.close(1000, res);
            return;
        }
        const player = game.players[playerNumber];
        player.status = "online";
        const wsFunctions = {
            updatePlayerData(data) {
                const playerData = data.player;
                const player = game.players[playerData.playerNumber];
                if (!player)
                    return;
                player.update(playerData);
                game.webSocketServer.clients.forEach((client) => {
                    if (client !== webSocket) {
                        const res = data;
                        client.send(JSON.stringify(res));
                    }
                });
            },
            playerReady(data) {
                if (game.isRunning) {
                    // join the game later scenario.
                    const data = { command: "joinGame", game: game.getWSData() };
                    webSocket.send(JSON.stringify(data));
                    return;
                }
                // first start of the game scenario.
                const players = game.players;
                for (const p of players)
                    if (p.status !== "ready")
                        return;
                game.isRunning = true;
                game.webSocketServer.clients.forEach((client) => {
                    const data = { command: "startGame" };
                    client.send(JSON.stringify(data));
                });
            },
            newChip(data) {
                game.addChip(data.chip);
                game.webSocketServer.clients.forEach((client) => {
                    if (client !== webSocket) {
                        const res = data;
                        client.send(JSON.stringify(res));
                    }
                });
            },
            newBoundary(data) {
                game.addBoundary();
            },
            pong() {
                lastPong = Date.now();
            }
        };
        webSocket.on("message", msg => {
            const data = JSON.parse(String(msg));
            if (!(data.command))
                console.error("No ettt");
            const fun = wsFunctions[data.command];
            if (fun)
                fun(data);
        });
        const close = () => {
            const p = game.players[playerNumber];
            p.status = "offline";
            const data = { command: "updatePlayerData", player: p };
            wsFunctions.updatePlayerData(data);
            // check if any player is leaft
            for (const p of game.players)
                if (p.status !== "offline")
                    return;
            // if not close the game
            game.webSocketServer.clients.forEach(ws => {
                ws.close();
            });
            game.webSocketServer.close();
            game_1.games.delete(game.gameID);
            console.log(`Terminated Game: ${game.gameID}`);
        };
        let lastPong;
        let timerID;
        const ping = () => {
            const data = { command: "ping" };
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
        const res = { command: "connectAsPlayer", playerData: game.getAllPlayerData(), playerNumber: playerNumber, cdfw: game.winCondition, movesInRow: game.movesInRow };
        webSocket.send(JSON.stringify(res));
        const updateData = { command: "updatePlayerData", player: { playerNumber: playerNumber, name: player.name, color: player.color, status: player.status, shape: player.shape } };
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
