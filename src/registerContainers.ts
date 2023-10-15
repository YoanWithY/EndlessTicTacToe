/// <reference path="../shared/types.d.ts" />
import { HorizontalContainer } from "./containers.js";

class NewGameInfoPanel extends HTMLElement {
    static create(gameID: number, wrapper: HTMLElement, newGamePanel: NewGamePanel) {
        const p = document.createElement("new-game-info-panel") as NewGameInfoPanel;

        const linkPanel = document.createElement("horizontal-container") as HorizontalContainer;
        const linkStr = `${window.location.origin}/game/${gameID}`;

        const h2 = document.createElement("h2");
        h2.textContent = `Your Game ID: ${gameID}`;
        linkPanel.appendChild(h2);

        const copyToClipboardImage = document.createElement("img");
        copyToClipboardImage.setAttribute("src", "./copytoclipboard.svg");
        copyToClipboardImage.setAttribute("alt", "Copy to Clipboard");

        const copyToolTip = document.createElement("div");
        copyToolTip.classList.add("tooltip");
        copyToolTip.textContent = "Copied to Clipboard";

        const copyToClipboardButton = document.createElement("button");
        copyToClipboardButton.setAttribute("class", "svgButton");
        copyToClipboardButton.appendChild(copyToClipboardImage);
        copyToClipboardButton.addEventListener("click", e => {
            navigator.clipboard.writeText(linkStr);
            copyToClipboardButton.appendChild(copyToolTip);
            setTimeout(() => {
                copyToClipboardButton.removeChild(copyToolTip);
            }, 2000);
        });

        linkPanel.appendChild(copyToClipboardButton)
        p.appendChild(linkPanel);

        const hc = document.createElement("horizontal-container") as HorizontalContainer;

        const backButton = document.createElement("button");
        backButton.addEventListener("click", e => window.location.href = window.location.origin);
        backButton.textContent = "Back to Main";
        hc.appendChild(backButton);

        const joinButton = document.createElement("button");
        joinButton.textContent = "Join";
        joinButton.addEventListener("click", e => window.location.href = linkStr);
        hc.appendChild(joinButton);

        p.appendChild(document.createElement("br"));

        p.appendChild(hc);
        return p;
    }
}
customElements.define("new-game-info-panel", NewGameInfoPanel);

export class NewGamePanel extends HTMLElement {
    static create(gameRegistration: HTMLElement, wrapper: HTMLElement): NewGamePanel {
        const ngp = document.createElement("new-game-panel") as NewGamePanel;
        ngp.setAttribute("class", "verticalContainer");

        const title = document.createElement("h2");
        title.textContent = "New Game";
        ngp.appendChild(title);

        const numberOfPlayerLabel = document.createElement("label");
        numberOfPlayerLabel.textContent = "Number of Players";
        numberOfPlayerLabel.setAttribute("range", "2 - 7");
        ngp.appendChild(numberOfPlayerLabel);

        const numberOfPlayerInput = document.createElement("input");
        numberOfPlayerInput.setAttribute("type", "number");
        numberOfPlayerInput.setAttribute("tabindex", "1");
        numberOfPlayerInput.value = String(2);
        ngp.appendChild(numberOfPlayerInput);
        numberOfPlayerInput.addEventListener("blur", e => {
            numberOfPlayerInput.value = String(Math.min(Math.max(Math.round(Number(numberOfPlayerInput.value)), 2), 6));
        });
        ngp.appendChild(document.createElement("br"));

        const movesPerTurnLabel = document.createElement("label");
        movesPerTurnLabel.textContent = "Moves per Turn";
        movesPerTurnLabel.setAttribute("range", "1 - 4");
        ngp.appendChild(movesPerTurnLabel);


        const movesPerTurnInput = document.createElement("input");
        movesPerTurnInput.setAttribute("type", "number");
        movesPerTurnInput.setAttribute("tabindex", "2");
        movesPerTurnInput.value = String(1);
        movesPerTurnInput.addEventListener("blur", e => {
            movesPerTurnInput.value = String(Math.min(Math.max(Math.round(Number(movesPerTurnInput.value)), 1), 4));
        });
        ngp.appendChild(movesPerTurnInput);

        ngp.appendChild(document.createElement("br"));

        const winConditionLabel = document.createElement("label");
        winConditionLabel.textContent = "Win Condition";
        winConditionLabel.setAttribute("range", "4 - 7");
        ngp.appendChild(winConditionLabel);

        const winConditionInput = document.createElement("input");
        winConditionInput.setAttribute("type", "number");
        winConditionInput.setAttribute("tabindex", "3");
        winConditionInput.value = String(4);
        winConditionInput.addEventListener("blur", e => {
            winConditionInput.value = String(Math.min(Math.max(Math.round(Number(winConditionInput.value)), 4), 7));
        })
        ngp.appendChild(winConditionInput);

        ngp.appendChild(document.createElement("br"));


        const hc = HorizontalContainer.create();

        const backButton = document.createElement("button");
        backButton.textContent = "Back";
        backButton.addEventListener("click", (MouseEvent) => {
            wrapper.replaceChild(gameRegistration, ngp);
        });
        hc.appendChild(backButton);

        const startButton = document.createElement("button");
        startButton.textContent = "Start";
        startButton.setAttribute("tabindex", "3");
        startButton.addEventListener("click", async (MouseEvent) => {
            const ngr: req_newGame = { playerCount: Number(numberOfPlayerInput.value) as ws_player_count, movesPerTurn: Number(movesPerTurnInput.value) as ws_move_in_row, winCondition: Number(winConditionInput.value) as ws_cnfw };
            const res = await fetch("/newGame", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ngr)
            });
            const data = await res.json() as res_newGame;
            const ngip = NewGameInfoPanel.create(data.gameID, wrapper, ngp) as NewGameInfoPanel;
            wrapper.replaceChild(ngip, ngp);
        });
        hc.appendChild(startButton);

        ngp.appendChild(hc);


        return ngp;
    }
}
customElements.define("new-game-panel", NewGamePanel);

export class GameRegistration extends HTMLElement {
    static create(wrapper: HTMLElement) {
        const gameRegistration = document.createElement("game-registration");
        const gameIDInput = document.createElement("input");
        gameIDInput.setAttribute("placeholder", "Game ID");
        gameIDInput.setAttribute("type", "number");

        const joinGameButton = document.createElement("button");
        joinGameButton.setAttribute("disabled", "true");
        joinGameButton.textContent = "Join Game";

        {
            const hc = HorizontalContainer.create();
            hc.appendChild(gameIDInput);
            hc.appendChild(joinGameButton);
            gameRegistration.appendChild(hc);

        }

        const newGameButton = document.createElement("button");
        newGameButton.textContent = "New Game";
        gameRegistration.appendChild(newGameButton);

        const newGamePanel = NewGamePanel.create(gameRegistration, wrapper);

        gameIDInput.addEventListener("input", async (ev: Event) => {
            const gameID = Number(gameIDInput.value);
            const putData: req_doesGameExist = { gameID: gameID };
            const response = await fetch("/doesGameExist", {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(putData)
            });
            const res = await response.json() as res_doesGameExist;
            joinGameButton.disabled = !res.exists;
        });

        joinGameButton.addEventListener("click", (ev) => {
            const gameID = Number(gameIDInput.value);
            window.location.href = window.location.origin + `/game/${gameID}`;
        });

        newGameButton.addEventListener("click", async (mev: MouseEvent) => {
            wrapper.replaceChild(newGamePanel, gameRegistration);
        });
        return gameRegistration;
    }
}
customElements.define("game-registration", GameRegistration);