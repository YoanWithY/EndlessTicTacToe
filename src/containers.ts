export class VerticalContainer extends HTMLElement {
    static create() {
        const v = document.createElement("vertical-container");
        return v;
    }
}
customElements.define("vertical-container", VerticalContainer);

export class HorizontalContainer extends HTMLElement {
    static create() {
        const v = document.createElement("horizontal-container");
        return v;
    }
}
customElements.define("horizontal-container", HorizontalContainer);