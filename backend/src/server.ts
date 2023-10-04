/// <reference path="../../shared/types.d.ts" />
import * as http from 'http';
import * as fs from "fs";
import * as path from "path";
import * as WebSocket from 'ws';
import * as net from 'net'
import Game, { Player, games, genGame, shapes } from './game';
import { bodyAsObject } from './bodyParse';
import { isNumericLiteral } from 'typescript';

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
        games.set(game.gameID, game);
        console.log(`Created new game with ID: ${game.gameID} and ${game.playerCount} players.`);
        servJson<res_newGame>(response, { gameID: game.gameID });
    },
    async game(request: http.IncomingMessage, response: Response, urlArr: string[]) {
        const num = Number.parseInt(urlArr[1]);
        if (isNaN(num)) {
            servFile(response, request.url);
            return;
        }

        const game = games.get(num);
        if (!game) {
            console.log(`The game ID ${num} is unknown.`);
            response.writeHead(301, { 'Location': '/' });
            response.end();
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

const wsFunctions: { [key: string]: (webSocket: WebSocket, game: Game, data: any) => void } = {
    updatePlayerData(webSocket: WebSocket, game: Game, data: ws_req_update_player_data) {
        game.webSocketServer.clients.forEach((client: WebSocket) => {
            const res: ws_res_update_player_data = data;
            client.send(JSON.stringify(res));
        });
    }
}

function httpUpgradeHandling(request: http.IncomingMessage, socket: net.Socket, head: Buffer) {
    const urlString = request.url;

    if (!urlString) {
        socket.destroy();
        throw new Error("Url does not exist!");
    }

    const match = urlString.match(/\d+/g);
    if (!match || match.length === 0) {
        socket.destroy();
        throw new Error("Could not process gameID.");
    }

    const gameID = Number(match[0]);
    const game = games.get(gameID);
    if (!game) {
        socket.destroy();
        throw new Error("Game does not exist!");
    }

    game.webSocketServer.handleUpgrade(request, socket, head, (webSocket: WebSocket, request: http.IncomingMessage) => {
        const playerNumber = game.getFirstAvailablePlayerNumber();
        if (playerNumber === undefined) {
            const res: ws_close_connection_reject = "serverIsFull";
            webSocket.close(1000, res);
            return
        }

        const player = new Player(webSocket, "Player Name", playerNumber);
        game.players[playerNumber] = player;
        for (const s of shapes) {
            if (game.migrateShape(s, player))
                break;
        }

        const res: ws_res_connection_as_player = { command: "connectAsPlayer", playerData: game.getAllPlayerData(), playerNumber: playerNumber };
        webSocket.send(JSON.stringify(res));

        webSocket.on("message", msg => {
            const data = JSON.parse(String(msg)) as ettt;
            if (!(data.command))
                console.error("No ettt");

            const fun = wsFunctions[data.command];
            if (fun)
                fun(webSocket, game, data);
        });
    });
}

const server = http.createServer(httpHandling);
server.on('upgrade', httpUpgradeHandling);

const port = process.env.PORT || 3000;
server.listen(port);

console.log(`Server running at http://localhost:${port}`);