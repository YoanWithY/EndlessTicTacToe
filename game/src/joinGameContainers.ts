/// <reference path="../../shared/types.d.ts" />
import { HorizontalContainer } from "./containers.js";
import { Color, Player, shapePaths, shapesPath2D } from "./gameState.js";

export class JoinGamePanel extends HTMLElement {
    otherPlayerPanels: (OtherPlayerPanel | null)[] = [];
    static create(wrapper: HTMLElement, players: Player[], gameID: number, playerNumber: number, webSocket: WebSocket): JoinGamePanel {
        const jgp = document.createElement("join-game-panel") as JoinGamePanel;

        const title = document.createElement("h2");
        title.textContent = `Join Game: ${gameID}`;
        jgp.appendChild(title);

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            if (i === playerNumber) {
                jgp.otherPlayerPanels[i] = null;
                jgp.appendChild(ThisPlayerPanel.create(player, webSocket));
                continue;
            }
            const otherPlayerPanel = OtherPlayerPanel.create(player);
            jgp.otherPlayerPanels[i] = otherPlayerPanel;
            jgp.appendChild(otherPlayerPanel);
        }
        return jgp;
    }
}
customElements.define("join-game-panel", JoinGamePanel);

class ThisPlayerPanel extends HTMLElement {
    color!: ws_color;
    colorRGB!: Color;
    icon!: SVGSVGElement;
    path!: SVGPathElement;
    static create(player: Player, webSocket: WebSocket) {
        const p = document.createElement("this-player-panel") as ThisPlayerPanel;

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
        path.setAttributeNS(null, "fill", color.toString())
        icon.appendChild(path);
        p.path = path;
        p.icon = icon;
        p.appendChild(icon);

        function updatePlayerData() {
            const data: ws_req_update_player_data = { command: "updatePlayerData", player: player.getWSData() };
            webSocket.send(JSON.stringify(data));
        }

        const playerNameInput = document.createElement("input");
        playerNameInput.setAttribute("type", "text");
        playerNameInput.value = player.name;
        playerNameInput.setAttribute("class", "playerNameInput");
        playerNameInput.addEventListener("input", (e) => {
            player.name = playerNameInput.value;
            updatePlayerData();
        })
        p.appendChild(playerNameInput);

        return p;
    }
}
customElements.define("this-player-panel", ThisPlayerPanel);

class OtherPlayerPanel extends HTMLElement {
    playerNameText!: HTMLSpanElement;
    color!: Color;
    icon!: SVGSVGElement;
    path!: SVGPathElement;
    playerReadyText!: HTMLSpanElement;
    static create(player: Player) {
        const p = document.createElement("other-player-panel") as OtherPlayerPanel;

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
        path.setAttributeNS(null, "fill", player.colorRGB.toString())
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
        p.playerReadyText = playerReadyText;
        p.appendChild(playerReadyText);
        p.playerReadyText = playerReadyText;

        return p;
    }

    setFromPlayer(player: Player) {
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

