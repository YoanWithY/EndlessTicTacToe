/// <reference path="../../shared/types.d.ts"/>
import { HorizontalContainer, VerticalContainer } from "./containers.js";
import { Color, Game, Player, shapesPath2D } from "./gameState.js";
import { JoinGamePanel } from "./joinGameContainers.js";

const canvas = document.createElement("canvas");
canvas.setAttribute("id", "canvas");
document.body.appendChild(canvas);

const wrapper = VerticalContainer.create();
wrapper.setAttribute("id", "wrapper");

const headline = document.createElement("h1");
headline.textContent = "Endless Tic Tac Toe";
wrapper.appendChild(headline);

document.body.appendChild(wrapper);

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
if (!ctx)
    throw new Error("No Context.");

const gameID = Number.parseInt(window.location.pathname.split("/").slice(-1)[0]);
if (isNaN(gameID))
    throw new Error("NaN Game.");

const webSocket = new WebSocket(window.location.href.replace("http", "ws"), "ettt");

function wsSend<T>(data: T) {
    webSocket.send(JSON.stringify(data));
}

webSocket.addEventListener("open", e => {
    console.log("Opend Web socket connection:", e);
    const connectReq: ws_req_connection = { command: "connectionRequest" };
    wsSend<ws_req_connection>(connectReq);
});

webSocket.addEventListener("error", (e) => {
    alert("WebSocket Error.");
})

const players: Player[] = [];
let game: Game;
let playerNumber: number;

function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
}
resize();

window.addEventListener("resize", resize);

let joinGamePanel: JoinGamePanel;

const ws_all_functions: { [key: string]: (webSocket: WebSocket, data: any) => void } = {
    connectAsPlayer(webSocket: WebSocket, data: ws_res_connection_as_player) {
        const playerData = data.playerData;
        for (let i = 0; i < playerData.length; i++) {
            const p = playerData[i];
            players[i] = new Player(p.name, p.color, p.shape, p.playerNumber, p.isPlayerRead);
        }
        playerNumber = data.playerNumber;
        joinGamePanel = JoinGamePanel.create(wrapper, players, gameID, playerNumber, webSocket);
        wrapper.appendChild(joinGamePanel);
    },
}

const ws_player_functions: { [key: string]: (webSocket: WebSocket, data: any) => void } = {
    startGame(webSocket: WebSocket) {
        game = new Game(canvas, players);
        game.render();
    },
    updatePlayerData(webSocket: WebSocket, data: ws_res_update_player_data) {
        const newPlayerData = data.player;
        if (newPlayerData.playerNumber === playerNumber)
            return;

        const player = players[newPlayerData.playerNumber];
        player.setFromData(newPlayerData);

        if (!joinGamePanel)
            return;

        const opp = joinGamePanel.otherPlayerPanels[player.playerNumber];
        if (opp === null)
            return;
        opp.setFromPlayer(player);
    }
}

webSocket.addEventListener("message", (ev: MessageEvent<any>) => {
    const data = JSON.parse(ev.data) as ettt;
    if (playerNumber !== undefined) {
        const fun = ws_player_functions[data.command];
        if (fun)
            fun(webSocket, data);
        return;
    }

    const fun = ws_all_functions[data.command];
    if (fun)
        fun(webSocket, data);


});

const ws_close_function: { [key: string]: () => void } = {
    serverIsFull() {
        const hc = document.createElement("vertical-container") as HorizontalContainer;
        const h2 = document.createElement("h2");
        h2.textContent = "Server is Full";
        const button = document.createElement("button");
        button.textContent = "Back";
        button.addEventListener("click", e => {
            window.location.href = window.location.origin;
        });

        hc.appendChild(h2);
        hc.appendChild(button);
        wrapper.appendChild(hc);
    }
}

webSocket.addEventListener("close", (ev: CloseEvent) => {
    const fun = ws_close_function[ev.reason];
    if (fun)
        fun();
});
