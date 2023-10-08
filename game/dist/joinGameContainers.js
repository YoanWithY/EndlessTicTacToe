import { shapePaths } from "./gameState.js";
function updatePlayerData(webSocket, player) {
    const data = { command: "updatePlayerData", player: player.getWSData() };
    webSocket.send(JSON.stringify(data));
}
export class JoinGamePanel extends HTMLElement {
    constructor() {
        super(...arguments);
        this.otherPlayerPanels = [];
    }
    static create(wrapper, players, gameID, playerNumber, webSocket) {
        const jgp = document.createElement("join-game-panel");
        const title = document.createElement("h2");
        title.textContent = `Join Game: ${gameID}`;
        jgp.appendChild(title);
        let thisPlayerPanel;
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            if (i === playerNumber) {
                jgp.otherPlayerPanels[i] = null;
                thisPlayerPanel = ThisPlayerPanel.create(player, webSocket);
                jgp.appendChild(thisPlayerPanel);
                continue;
            }
            const otherPlayerPanel = OtherPlayerPanel.create(player);
            jgp.otherPlayerPanels[i] = otherPlayerPanel;
            jgp.appendChild(otherPlayerPanel);
        }
        const hc = document.createElement("horizontal-container");
        const backButton = document.createElement("button");
        backButton.textContent = "Back";
        backButton.addEventListener("click", e => {
            window.location.href = window.location.origin;
        });
        hc.appendChild(backButton);
        const readyButton = document.createElement("button");
        readyButton.textContent = "Ready";
        readyButton.addEventListener("click", e => {
            const p = players[playerNumber];
            p.isPlayerReady = true;
            updatePlayerData(webSocket, p);
            readyButton.disabled = true;
            thisPlayerPanel.nameInput.disabled = true;
            const data = { command: "playerReady" };
            webSocket.send(JSON.stringify(data));
        });
        hc.appendChild(readyButton);
        jgp.appendChild(hc);
        return jgp;
    }
}
customElements.define("join-game-panel", JoinGamePanel);
class ThisPlayerPanel extends HTMLElement {
    static create(player, webSocket) {
        const p = document.createElement("this-player-panel");
        const playerNumberText = document.createElement("span");
        playerNumberText.textContent = String(player.playerNumber + 1);
        playerNumberText.setAttribute("class", "playerNumber");
        p.appendChild(playerNumberText);
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute("class", "playerIcon");
        icon.setAttributeNS(null, "viewBox", "0,0,1,1");
        const shapePath = shapePaths.get(player.shape);
        if (!shapePath)
            throw new Error("No shape Path: " + player.shape);
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttributeNS(null, "d", shapePath);
        const color = player.colorRGB;
        path.setAttributeNS(null, "fill", color.toString());
        icon.appendChild(path);
        p.path = path;
        p.icon = icon;
        p.appendChild(icon);
        const playerNameInput = document.createElement("input");
        playerNameInput.setAttribute("type", "text");
        playerNameInput.value = player.name;
        playerNameInput.setAttribute("class", "playerNameInput");
        playerNameInput.addEventListener("input", (e) => {
            player.name = playerNameInput.value;
            updatePlayerData(webSocket, player);
        });
        p.appendChild(playerNameInput);
        p.nameInput = playerNameInput;
        return p;
    }
}
customElements.define("this-player-panel", ThisPlayerPanel);
class OtherPlayerPanel extends HTMLElement {
    static create(player) {
        const p = document.createElement("other-player-panel");
        const playerNumberText = document.createElement("span");
        playerNumberText.textContent = String(player.playerNumber + 1);
        playerNumberText.setAttribute("class", "playerNumber");
        p.appendChild(playerNumberText);
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute("class", "playerIcon");
        icon.setAttributeNS(null, "viewBox", "0,0,1,1");
        const shapePath = shapePaths.get(player.shape);
        if (!shapePath)
            throw new Error("No shape Path: " + player.shape);
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttributeNS(null, "d", shapePath);
        path.setAttributeNS(null, "fill", player.colorRGB.toString());
        icon.appendChild(path);
        p.path = path;
        p.icon = icon;
        p.appendChild(icon);
        const playerNameText = document.createElement("span");
        playerNameText.textContent = player.name;
        playerNameText.setAttribute("class", "playerName");
        p.appendChild(playerNameText);
        p.playerNameText = playerNameText;
        const playerReadyText = document.createElement("span");
        playerReadyText.textContent = player.isPlayerReady ? "Ready" : "-";
        playerReadyText.setAttribute("class", "playerReady");
        p.appendChild(playerReadyText);
        p.playerReadyText = playerReadyText;
        return p;
    }
    setFromPlayer(player) {
        this.playerNameText.textContent = player.name;
        const shapePath = shapePaths.get(player.shape);
        if (!shapePath)
            throw new Error("No shape Path: " + player.shape);
        this.path.setAttributeNS(null, "d", shapePath);
        this.path.setAttributeNS(null, "fill", player.colorRGB.toString());
        console.log(player.colorRGB.toString());
        this.playerReadyText.textContent = player.isPlayerReady ? "Ready" : "-";
    }
}
customElements.define("other-player-panel", OtherPlayerPanel);
