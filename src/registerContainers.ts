/// <reference path="../shared/types.d.ts" />
import { HorizontalContainer } from "./containers.js";

export class NewGamePanel extends HTMLElement {
    static create(gameRegistration: HTMLElement, wrapper: HTMLElement): NewGamePanel {
        const ngp = document.createElement("new-game-panel");
        ngp.setAttribute("class", "verticalContainer");

        const title = document.createElement("h2");
        title.textContent = "New Game";
        ngp.appendChild(title);

        const numberOfPlayerLabel = document.createElement("label");
        numberOfPlayerLabel.textContent = "Number of Players";
        ngp.appendChild(numberOfPlayerLabel);

        const numberOfPlayerInput = document.createElement("input");
        numberOfPlayerInput.setAttribute("type", "number");
        numberOfPlayerInput.value = String(2);
        ngp.appendChild(numberOfPlayerInput);
        numberOfPlayerInput.addEventListener("blur", e => {
            numberOfPlayerInput.value = String(Math.min(Math.max(Number(numberOfPlayerInput.value), 2), 6));
        });

        ngp.appendChild(document.createElement("br"));

        const movesPerTurnLabel = document.createElement("label");
        movesPerTurnLabel.textContent = "Moves per Turn";
        ngp.appendChild(movesPerTurnLabel);

        const movesPerTurnInput = document.createElement("input");
        movesPerTurnInput.setAttribute("type", "number");
        movesPerTurnInput.value = String(1);
        ngp.appendChild(movesPerTurnInput);

        ngp.appendChild(document.createElement("br"));

        const winConditionLabel = document.createElement("label");
        winConditionLabel.textContent = "Win Condition";
        ngp.appendChild(winConditionLabel);

        const winConditionInput = document.createElement("input");
        winConditionInput.setAttribute("type", "number");
        winConditionInput.value = String(4);
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
        startButton.addEventListener("click", async (MouseEvent) => {
            const ngr: req_newGame = { playerCount: Number(numberOfPlayerInput.value), movesPerTurn: Number(movesPerTurnInput.value), winCondition: Number(winConditionInput.value) };
            const res = await fetch("/newGame", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ngr)
            });
            const data = await res.json() as res_newGame;
            window.location.href = window.location.origin + `/game/${data.gameID}`;
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