/// <reference path="../shared/types.d.ts" />
import { VerticalContainer } from "./containers.js";
import { GameRegistration, } from "./registerContainers.js";

const wrapper = VerticalContainer.create();
wrapper.setAttribute("id", "wrapper");

const headline = document.createElement("h1");
headline.textContent = "Endless Tic Tac Toe";
wrapper.appendChild(headline);

const gameRegistration = GameRegistration.create(wrapper);
wrapper.appendChild(gameRegistration);

document.body.appendChild(wrapper);

