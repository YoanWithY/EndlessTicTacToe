import { VerticalContainer } from "./containers.js";
import { Game, Player } from "./gameState.js";
import { JoinGamePanel, OverlayPanel } from "./joinGameContainers.js";
const canvas = document.createElement("canvas");
canvas.setAttribute("id", "canvas");
document.body.appendChild(canvas);
const wrapper = VerticalContainer.create();
wrapper.setAttribute("id", "wrapper");
document.body.appendChild(wrapper);
const headline = document.createElement("h1");
headline.textContent = "Endless Tic Tac Toe";
wrapper.appendChild(headline);
const ctx = canvas.getContext("2d");
if (!ctx)
    throw new Error("No Context.");
const gameID = Number.parseInt(window.location.pathname.split("/").slice(-1)[0]);
if (isNaN(gameID))
    throw new Error("NaN Game.");
const webSocket = new WebSocket(window.location.href.replace("http", "ws"), "ettt");
export function wsSend(data) {
    if (webSocket.readyState === WebSocket.CLOSED) {
        if (confirm("You are not connected to the game. I will try to reconnect."))
            location.reload();
        else
            window.location.href = window.location.origin;
    }
    webSocket.send(JSON.stringify(data));
}
let lastPing = Date.now();
webSocket.addEventListener("open", e => {
    const connectReq = { command: "connectionRequest" };
    wsSend(connectReq);
    const interval = setInterval(() => {
        const dt = Date.now() - lastPing;
        if (dt > 3000 || webSocket.readyState === WebSocket.CLOSED) {
            webSocket.close();
            if (confirm("The connection to the server ist interrupted. I will try to reconnect."))
                location.reload();
            else
                window.location.href = window.location.origin;
            clearInterval(interval);
        }
    }, 100);
});
webSocket.addEventListener("error", (e) => {
    alert("The game you request does not exist. You will be redirecet to the main Page.");
    window.location.href = window.location.origin;
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
            players[i] = new Player(p.name, p.color, p.shape, p.playerNumber, p.status);
        }
        playerNumber = data.playerNumber;
        cnfw = data.cdfw;
        movesInRow = data.movesInRow;
        joinGamePanel = JoinGamePanel.create(wrapper, players, gameID, playerNumber, webSocket);
        wrapper.appendChild(joinGamePanel);
    },
};
webSocket.addEventListener("message", (ev) => {
    const ws_player_functions = {
        joinGame(data) {
            game = new Game(webSocket, canvas, players, playerNumber, cnfw, movesInRow, data.game);
            const overlay = OverlayPanel.create(game);
            document.body.replaceChild(overlay, wrapper);
            game.render();
        },
        startGame() {
            game = new Game(webSocket, canvas, players, playerNumber, cnfw, movesInRow);
            const overlay = OverlayPanel.create(game);
            document.body.replaceChild(overlay, wrapper);
            game.render();
        },
        updatePlayerData(data) {
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
        newChip(data) {
            game.newChipProtokoll(data.chip, false);
            game.render();
        },
        ping(data) {
            wsSend({ command: "pong" });
            lastPing = Date.now();
        }
    };
    const data = JSON.parse(ev.data);
    if (playerNumber !== undefined) {
        const fun = ws_player_functions[data.command];
        if (fun)
            fun(data);
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
