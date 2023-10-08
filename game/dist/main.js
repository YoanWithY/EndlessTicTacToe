import { VerticalContainer } from "./containers.js";
import { Game, Player } from "./gameState.js";
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
const ctx = canvas.getContext("2d");
if (!ctx)
    throw new Error("No Context.");
const gameID = Number.parseInt(window.location.pathname.split("/").slice(-1)[0]);
if (isNaN(gameID))
    throw new Error("NaN Game.");
const webSocket = new WebSocket(window.location.href.replace("http", "ws"), "ettt");
function wsSend(data) {
    webSocket.send(JSON.stringify(data));
}
webSocket.addEventListener("open", e => {
    console.log("Opend Web socket connection:", e);
    const connectReq = { command: "connectionRequest" };
    wsSend(connectReq);
});
webSocket.addEventListener("error", (e) => {
    alert("WebSocket Error.");
});
const players = [];
let game;
let playerNumber;
let cnfw;
let movesInRow;
function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    if (game)
        game.render();
}
resize();
window.addEventListener("resize", resize);
let joinGamePanel;
const ws_all_functions = {
    connectAsPlayer(webSocket, data) {
        const playerData = data.playerData;
        for (let i = 0; i < playerData.length; i++) {
            const p = playerData[i];
            players[i] = new Player(p.name, p.color, p.shape, p.playerNumber, p.isPlayerRead);
        }
        playerNumber = data.playerNumber;
        cnfw = data.cdfw;
        movesInRow = data.movesInRow;
        joinGamePanel = JoinGamePanel.create(wrapper, players, gameID, playerNumber, webSocket);
        wrapper.appendChild(joinGamePanel);
    },
};
const ws_player_functions = {
    startGame(webSocket) {
        game = new Game(webSocket, canvas, players, playerNumber, cnfw, movesInRow);
        document.body.removeChild(wrapper);
        game.render();
    },
    updatePlayerData(webSocket, data) {
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
    },
    newChip(webSocket, data) {
        game.newChipProtokoll(data.chip.x, data.chip.y, false);
        game.render();
    }
};
webSocket.addEventListener("message", (ev) => {
    const data = JSON.parse(ev.data);
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
const ws_close_function = {
    serverIsFull() {
        const hc = document.createElement("vertical-container");
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
};
webSocket.addEventListener("close", (ev) => {
    const fun = ws_close_function[ev.reason];
    if (fun)
        fun();
});
