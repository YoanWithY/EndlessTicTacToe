import { wsSend } from "./main.js";

export class Chip {

    x: number;
    y: number;
    owner: number;

    constructor(x: number, y: number, owner: number) {
        this.x = x;
        this.y = y;
        this.owner = owner;
    }
}

export class Boundary {

    boundChip: Chip[];
    minX = Infinity;
    minY = Infinity
    maxX = -Infinity;
    maxY = -Infinity;
    width: number;
    height: number;

    constructor(oc: Chip[]) {
        this.boundChip = oc;
        for (let c of this.boundChip) {
            if (c.x < this.minX)
                this.minX = c.x;
            if (c.y < this.minY)
                this.minY = c.y;
            if (c.x > this.maxX)
                this.maxX = c.x;
            if (c.y > this.maxY)
                this.maxY = c.y;
        }
        this.width = this.maxX - this.minX + 1;
        this.height = this.maxY - this.minY + 1;
    }
}

function clamp(v: number, min: number, max: number) {
    return Math.min(Math.max(v, min), max);
}

export class Color {
    r: number;
    g: number;
    b: number;
    constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    /**
     * Creates an RGB color from HSV. HSV values are interpreted as in range [0, 1].
     * @param h Hue
     * @param s Saturation
     * @param v Value
     */
    static fromHSV(h: number, s: number, v: number) {
        h = clamp(h, 0, 1);
        s = clamp(s, 0, 1);
        v = clamp(v, 0, 1);
        const hi = Math.floor(h * 6);
        const f = h * 6 - hi;
        const p = v * (1 - s);
        const q = v * (1 - s * f);
        const t = v * (1 - s * (1 - f));
        switch (hi) {
            case 1:
                return new Color(q, v, p);
            case 2:
                return new Color(p, v, t);
            case 3:
                return new Color(p, q, v);
            case 4:
                return new Color(t, p, v);
            case 5:
                return new Color(v, p, q);
        }
        return new Color(v, t, p);
    }

    toString() {
        return `rgb(${Math.floor(this.r * 255)}, ${Math.floor(this.g * 255)}, ${Math.floor(this.b * 255)})`;
    }
}

export const colors: Color[] = [
    Color.fromHSV(0 / 6, 1, 1),
    Color.fromHSV(1 / 6, 1, 1),
    Color.fromHSV(2 / 6, 1, 1),
    Color.fromHSV(3 / 6, 1, 1),
    Color.fromHSV(4 / 6, 1, 1),
    Color.fromHSV(5 / 6, 1, 1),
]

export class Player {
    name: string;
    color: ws_color;
    colorRGB: Color;
    colorStr: string;
    darkerColorStr: string;
    shape: ws_player_shape
    shapePath2D: Path2D;
    playerNumber: number;
    status: ws_player_status;

    constructor(playerName: string, color: ws_color, playerIcon: ws_player_shape, playerNubmer: number, status: ws_player_status) {
        this.name = playerName;
        this.color = color;
        this.colorRGB = colors[color];
        this.colorStr = this.colorRGB.toString();
        this.darkerColorStr = new Color(this.colorRGB.r / 3, this.colorRGB.g / 3, this.colorRGB.b / 3).toString();
        this.shape = playerIcon;
        this.shapePath2D = new Path2D(shapePaths.get(playerIcon));
        this.playerNumber = playerNubmer;
        this.status = status;
    }

    getWSData(): ws_player_data {
        return { color: this.color, name: this.name, status: this.status, playerNumber: this.playerNumber, shape: this.shape };
    }

    setFromData(newPlayerData: ws_player_data) {
        this.name = newPlayerData.name;
        this.color = newPlayerData.color;
        this.colorRGB = colors[newPlayerData.color];
        this.colorStr = this.colorRGB.toString();
        this.darkerColorStr = new Color(this.colorRGB.r / 3, this.colorRGB.g / 3, this.colorRGB.b / 3).toString();
        this.shape = newPlayerData.shape;
        this.shapePath2D = new Path2D(shapePaths.get(newPlayerData.shape));
        this.playerNumber = newPlayerData.playerNumber;
        this.status = newPlayerData.status;
    }
}

export const shapePaths: Map<ws_player_shape, string> = new Map();
shapePaths.set("square", "M 0,0.1 A 0.1, 0.1, 0, 0, 1, 0.1, 0 L 0.9, 0 A 0.1, 0.1, 0, 0, 1, 1, 0.1 L 1, 0.9 A 0.1, 0.1, 0, 0, 1, 0.9, 1 L 0.1, 1 A 0.1, 0.1, 0, 0, 1, 0, 0.9 Z M 0.2, 0.2 L 0.2, 0.8 L 0.8, 0.8 L 0.8, 0.2 Z");
shapePaths.set("square_filled", "M 0,0.1 A 0.1, 0.1, 0, 0, 1, 0.1, 0 L 0.9, 0 A 0.1, 0.1, 0, 0, 1, 1, 0.1 L 1, 0.9 A 0.1, 0.1, 0, 0, 1, 0.9, 1 L 0.1, 1 A 0.1, 0.1, 0, 0, 1, 0, 0.9 Z");
shapePaths.set("circle", "M 0.0,0.5 A 0.5,0.5,0,0,1,1,0.5 A 0.5,0.5,0,0,1,0,0.5 Z M 0.2,0.5 A 0.3,0.3,0,0,0,0.8,0.5 A 0.3,0.3,0,0,0,0.2,0.5 Z");
shapePaths.set("circle_filled", "M 0.0,0.5 A 0.5,0.5,0,0,1,1,0.5 A 0.5,0.5,0,0,1,0,0.5 Z");
shapePaths.set("triangle", "M 0.1,1 A 0.1,0.1,0,0,1,0.0105572809, 0.85527864045 L 0.4105572809,0.05527864045 A 0.1,0.1,0,0,1,0.5894427191,0.05527864045, L 0.9894427191,0.85527864045 A 0.1,0.1,0,0,1,0.9,1 Z M 0.2,0.8 L 0.8,0.8, L 0.5,0.2 Z");
shapePaths.set("triangle_filled", "M 0.1,1 A 0.1,0.1,0,0,1,0.0105572809, 0.85527864045 L 0.4105572809,0.05527864045 A 0.1,0.1,0,0,1,0.5894427191,0.05527864045, L 0.9894427191,0.85527864045 A 0.1,0.1,0,0,1,0.9,1 Z");
shapePaths.set("cross", "M 0.3585786437627, 0.5 L 0.0292893218813, 0.8292893218813 A 0.1,0.1,0,0,0,0.1707106781187, 0.9707106781187 L 0.5, 0.6414213562373 L 0.8292893218813, 0.9707106781187 A 0.1,0.1,0,0,0,0.9707106781187, 0.8292893218813 L 0.6414213562373, 0.5 L 0.9707106781187, 0.1707106781187 A 0.1,0.1,0,0,0,0.8292893218813, 0.0292893218813 L 0.5, 0.3585786437627 L 0.1707106781187, 0.0292893218813 A 0.1,0.1,0,0,0,0.0292893218813, 0.1707106781187");
shapePaths.set("none", "M 0,0 L 1,1");

export class Game {
    players: Player[];
    boundaries: Boundary[] = [];
    chips: Chip[] = [];

    s = 100;
    mx = 0;
    my = 0;
    isDragging = false;
    lastX = 0;
    lastY = 0;

    /**
     * Condition For Win
     */
    cnfw: ws_cnfw;
    movesInRow: ws_move_in_row;
    playerNumber: number;
    webSocket: WebSocket;

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    activePlayer: number;
    chipsPlaced: number;

    constructor(websocket: WebSocket, canvas: HTMLCanvasElement, players: Player[], playerNumber: number, cnfw: ws_cnfw, movesInRow: ws_move_in_row, game?: ws_game) {
        this.cnfw = cnfw;
        this.movesInRow = movesInRow;
        this.webSocket = websocket;
        this.playerNumber = playerNumber;
        this.players = players;
        if (game) {
            this.chips = game.chips;
            game.boundaries.forEach(b => this.boundaries.push(new Boundary(b.chips)));
            this.activePlayer = game.activePlayer;
            this.chipsPlaced = game.chipsPlaced;
        } else {
            this.activePlayer = 0;
            this.chipsPlaced = 0;
            this.newChipProtokoll(new Chip(0, 0, 0), false);
        }

        this.canvasZoom(1, 0, 0);
        this.canvas = canvas;
        const c = canvas.getContext("2d");
        if (!c)
            throw new Error("No Context");
        this.ctx = c;
        this.center();

        canvas.addEventListener("mousedown", (e) => {
            e.preventDefault();
            this.isDragging = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
        });

        canvas.addEventListener("click", e => {
            e.preventDefault();
            if (this.activePlayer !== playerNumber)
                return;

            const x = e.x - this.mx;
            const y = e.y - this.my;
            const ix = Math.floor(x / this.s);
            const iy = Math.floor(y / this.s);

            if (this.validateCoordsInput(ix, iy))
                this.newChipProtokoll(new Chip(ix, iy, this.activePlayer), true);

            this.render();
        })

        canvas.addEventListener("mousemove", (e) => {
            e.preventDefault();
            if (!this.isDragging) return;

            const currentX = e.clientX;
            const currentY = e.clientY;
            this.drag(currentX - this.lastX, currentY - this.lastY)
            this.lastX = currentX;
            this.lastY = currentY;
            this.render();
        });

        const touches: Touch[] = [];
        canvas.addEventListener("touchstart", e => {
            for (const t of e.touches)
                touches[t.identifier] = t;
        }, { passive: true });


        canvas.addEventListener("touchmove", e => {
            if (e.touches.length === 1) {
                const thisT = e.touches[0];
                const lastT = touches[thisT.identifier];
                this.drag(thisT.clientX - lastT.clientX, thisT.clientY - lastT.clientY);
                touches[thisT.identifier] = thisT;
            } else if (e.touches.length === 2) {
                const thisT1 = e.touches[0];
                const lastT1 = touches[thisT1.identifier];
                const thisT2 = e.touches[1];
                const lastT2 = touches[thisT2.identifier];
                const dx1 = thisT1.clientX - lastT1.clientX;
                const dy1 = thisT1.clientY - lastT1.clientY;
                const dx2 = thisT2.clientX - lastT2.clientX;
                const dy2 = thisT2.clientY - lastT2.clientY;
                const lastD = this.distance(lastT1.clientX, lastT1.clientY, lastT2.clientX, lastT2.clientY);
                const thisD = this.distance(thisT1.clientX, thisT1.clientY, thisT2.clientX, thisT2.clientY);
                const zoom = thisD / lastD;
                touches[thisT1.identifier] = thisT1;
                touches[thisT2.identifier] = thisT2;
                this.canvasZoom(zoom, (lastT1.clientX + lastT2.clientX) / 2, (lastT1.clientY + lastT2.clientY) / 2);
                this.drag((dx1 + dx2) / 2, (dy1 + dy2) / 2);
            }
            this.render();
        }, { passive: true });

        canvas.addEventListener("touchend", e => {
            for (const t of e.changedTouches)
                delete touches[t.identifier];
        }, { passive: true });

        canvas.addEventListener("wheel", e => {
            const val = 1 - e.deltaY / 512;
            this.canvasZoom(val, e.clientX, e.clientY);
            this.render()
        }, { passive: true });

        canvas.addEventListener("mouseup", () => {
            this.isDragging = false;
        });
    }

    center() {
        if (this.chips.length === 0) {
            this.mx = this.canvas.clientWidth / 2;
            this.my = this.canvas.clientHeight / 2;
            this.render();
            return;
        }
        const b = new Boundary(this.chips);
        const midX = (b.maxX + b.minX) / 2 + 0.5;
        const midY = (b.maxY + b.minY) / 2 + 0.5;
        this.mx = this.canvas.clientWidth / 2 - midX * this.s;
        this.my = this.canvas.clientHeight / 2 - midY * this.s;
        this.render();
    }

    drag(dx: number, dy: number) {
        this.mx += dx;
        this.my += dy;
    };

    canvasZoom(factor: number, x: number, y: number) {
        const tx = x - this.mx;
        const ty = y - this.my;
        const prevX = tx / this.s;
        const prevY = ty / this.s;
        this.s = clamp(this.s * factor, 20, 128);
        const newX = tx / this.s;
        const newY = ty / this.s;
        this.drag((newX - prevX) * this.s, (newY - prevY) * this.s);
    };

    render() {
        // reset
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = "high";
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        const background = "rgb(0, 0, 0)"
        this.ctx.resetTransform();
        this.ctx.scale(dpr, dpr);
        this.ctx.fillStyle = background;
        this.ctx.fillRect(0, 0, width, height);

        const chipSize = this.s - 9;

        const drawChip = (c: Chip) => {
            const p = this.players[c.owner];
            this.ctx.setTransform(
                chipSize * dpr, 0, 0, chipSize * dpr, (c.x * this.s + 5 + this.mx) * dpr, (c.y * this.s + 5 + this.my) * dpr);
            this.ctx.fill(p.shapePath2D, "evenodd");
        }

        // draw boundaries
        this.ctx.strokeStyle = "rgb(110, 110, 110)";
        this.ctx.lineWidth = 1;

        for (let i = this.boundaries.length - 1; i >= 0; i--) {
            this.ctx.resetTransform();
            this.ctx.scale(dpr, dpr);
            const bound = this.boundaries[i];
            const x = bound.minX * this.s + this.mx;
            const y = bound.minY * this.s + this.my;
            const w = bound.width * this.s;
            const h = bound.height * this.s
            this.ctx.fillStyle = "rgb(32, 32, 32)";
            this.ctx.fillRect(x, y, w, h);
            this.ctx.strokeRect(x + 0.5, y + 0.5, w, h);
            this.ctx.fillStyle = "rgb(100, 100, 100)";
            for (const c of bound.boundChip)
                drawChip(c);
        }

        this.ctx.resetTransform();
        this.ctx.scale(dpr, dpr);

        // draw grid
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = "rgba(110, 110, 110, 0.25)";
        for (let x = this.mx % this.s + 0.5; x < width; x += this.s) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0.5);
            this.ctx.lineTo(x, height + 0.5);
            this.ctx.stroke();
        }

        for (let y = this.my % this.s + 0.5; y < height; y += this.s) {
            this.ctx.beginPath();
            this.ctx.moveTo(0.5, y);
            this.ctx.lineTo(width + 0.5, y);
            this.ctx.stroke();
        }

        // draw chips
        for (const c of this.chips) {
            this.ctx.fillStyle = this.players[c.owner].colorStr;
            drawChip(c);
        }

        {
            const panelMargin = 16;
            const panelChipSize = 40;
            const margin = 8;
            const panelChipSpace = panelChipSize + 2 * margin;
            const totalChips = this.players.length * this.movesInRow;
            const chipsPerRow = Math.min(Math.floor((width - 2 * panelMargin) / (panelChipSpace + 1)), totalChips);
            const totalRows = Math.ceil(totalChips / chipsPerRow);
            const w = chipsPerRow * panelChipSpace;
            this.ctx.resetTransform();
            this.ctx.scale(dpr, dpr);
            let x = panelMargin;
            let y = panelMargin;
            this.ctx.fillStyle = background;
            this.ctx.strokeStyle = "rgb(32, 32, 128)";
            this.ctx.lineWidth = 1;


            this.ctx.fillRect(x, y, w, totalRows * panelChipSpace);
            this.ctx.strokeRect(x, y, w, totalRows * panelChipSpace);
            x += margin;
            y += margin;
            let rowCounter = 1;
            for (let i = 0; i < this.players.length; i++) {
                const p = this.players[i];
                for (let c = 0; c < this.movesInRow; c++) {
                    this.ctx.fillStyle = (p.playerNumber > this.activePlayer || (p.playerNumber === this.activePlayer && c >= this.chipsPlaced)) ? p.colorStr : p.darkerColorStr;
                    this.ctx.setTransform(
                        panelChipSize * dpr, 0, 0, panelChipSize * dpr, x * dpr, y * dpr);
                    this.ctx.fill(p.shapePath2D, "evenodd");
                    if (rowCounter === chipsPerRow) {
                        rowCounter = 1;
                        y += panelChipSpace;
                        x = panelMargin + margin;
                    } else {
                        x += panelChipSpace;
                        rowCounter++;
                    }
                }
            }
        }
    }

    newChipProtokoll(c: Chip, sendUpdate = false) {
        this.chips.push(c);
        if (sendUpdate)
            wsSend<ws_req_new_chip>({ command: "newChip", chip: c });

        this.checkForWinner(c.x, c.y, c.owner);

        this.chipsPlaced++;
        if (this.chipsPlaced === this.movesInRow) {
            this.activePlayer = (this.activePlayer + 1) % this.players.length;
            this.chipsPlaced = 0;
        }


    }

    /**
     * Validates if a given coordinate is inside a {@link Boundary}.
     * 
     * @param x_cord
     * @param y_cord
     * @return
     */
    private isInsdeBounds(x_cord: number, y_cord: number) {
        for (const b of this.boundaries)
            if (x_cord <= b.maxX && x_cord >= b.minX && y_cord <= b.maxY && y_cord >= b.minY)
                return true;
        return false;
    }

    /**
     * Validates if it is valid to set a chip on the given coordinate.
     * 
     * @param inputX
     * @param inputY
     * @return
     */
    public validateCoordsInput(inputX: number, inputY: number) {
        if (this.chips.length === 0 && this.nextToBound(inputX, inputY))
            return true;

        if (this.isInsdeBounds(inputX, inputY))
            return false;

        let can = false;
        for (const c of this.chips) {
            if (c.x == inputX && c.y == inputY)
                return false;

            if ((c.x == inputX - 1 || c.x == inputX + 1) && c.y == inputY)
                can = true;

            if ((c.y == inputY - 1 || c.y == inputY + 1) && c.x == inputX)
                can = true;
        }
        return can;
    }

    public nextToBound(x_cord: number, y_cord: number) {
        if (this.isInsdeBounds(x_cord, y_cord))
            return false;

        for (const b of this.boundaries) {
            if (x_cord == b.maxX + 1 && y_cord <= b.maxY && y_cord >= b.minY)
                return true;

            if (x_cord == b.minX - 1 && y_cord <= b.maxY && y_cord >= b.minY)
                return true;

            if (y_cord == b.maxY + 1 && x_cord <= b.maxX && x_cord >= b.minX)
                return true;

            if (y_cord == b.minY - 1 && x_cord <= b.maxX && x_cord >= b.minX)
                return true;
        }
        return false;
    }

    checkForWinner(x_i: number, y_i: number, playerNumber: number): void {
        let verticalCount: number = 1;
        let horizontalCount: number = 1;
        let diagonalOLUR: number = 1;
        let diagonalULOR: number = 1;

        let durchgang: number = 1;

        const tempChipliste: Chip[] = [];

        for (let i: number = 0; i < this.chips.length; i++) {
            if (
                this.chips[i].x <= x_i + this.cnfw &&
                this.chips[i].x >= x_i - this.cnfw &&
                this.chips[i].y <= y_i + this.cnfw &&
                this.chips[i].y >= y_i - this.cnfw &&
                this.chips[i].owner === playerNumber
            ) tempChipliste.push(this.chips[i]);
        }

        let pass: boolean = true;

        // x +durchgang --------------------

        while (durchgang < this.cnfw && pass) {
            pass = false;
            for (let i: number = 0; i < tempChipliste.length; i++) {
                if (tempChipliste[i].x + durchgang === x_i && tempChipliste[i].y === y_i) {
                    horizontalCount++;
                    durchgang++;
                    pass = true;
                }
            }
        }

        durchgang = 1;
        pass = true;

        // x -durchgang --------------------

        while (durchgang < this.cnfw && pass) {
            pass = false;
            for (let i: number = 0; i < tempChipliste.length; i++) {
                if (tempChipliste[i].x - durchgang === x_i && tempChipliste[i].y === y_i) {
                    horizontalCount++;
                    durchgang++;
                    pass = true;
                }
            }
        }

        durchgang = 1;
        pass = true;

        // y +durchgang --------------------

        while (durchgang < this.cnfw && pass) {
            pass = false;
            for (let i: number = 0; i < tempChipliste.length; i++) {
                if (tempChipliste[i].x === x_i && tempChipliste[i].y + durchgang === y_i) {
                    verticalCount++;
                    durchgang++;
                    pass = true;
                }
            }
        }

        durchgang = 1;
        pass = true;

        // y -durchgang --------------------

        while (durchgang < this.cnfw && pass) {
            pass = false;
            for (let i: number = 0; i < tempChipliste.length; i++) {
                if (tempChipliste[i].x === x_i && tempChipliste[i].y - durchgang === y_i) {
                    verticalCount++;
                    durchgang++;
                    pass = true;
                }
            }
        }

        durchgang = 1;
        pass = true;

        // ULOR +durchgang --------------------

        while (durchgang < this.cnfw && pass) {
            pass = false;
            for (let i: number = 0; i < tempChipliste.length; i++) {
                if (tempChipliste[i].x + durchgang === x_i && tempChipliste[i].y + durchgang === y_i) {
                    diagonalULOR++;
                    durchgang++;
                    pass = true;
                }
            }
        }

        durchgang = 1;
        pass = true;

        // ULOR -durchgang --------------------

        while (durchgang < this.cnfw && pass) {
            pass = false;
            for (let i: number = 0; i < tempChipliste.length; i++) {
                if (tempChipliste[i].x - durchgang === x_i && tempChipliste[i].y - durchgang === y_i) {
                    diagonalULOR++;
                    durchgang++;
                    pass = true;
                }
            }
        }

        durchgang = 1;
        pass = true;

        // OLUR +durchgang --------------------

        while (durchgang < this.cnfw && pass) {
            pass = false;
            for (let i: number = 0; i < tempChipliste.length; i++) {
                if (tempChipliste[i].x - durchgang === x_i && tempChipliste[i].y + durchgang === y_i) {
                    diagonalOLUR++;
                    durchgang++;
                    pass = true;
                }
            }
        }

        durchgang = 1;
        pass = true;

        // OLUR -durchgang --------------------

        while (durchgang < this.cnfw && pass) {
            pass = false;
            for (let i: number = 0; i < tempChipliste.length; i++) {
                if (tempChipliste[i].x + durchgang === x_i && tempChipliste[i].y - durchgang === y_i) {
                    diagonalOLUR++;
                    durchgang++;
                    pass = true;
                }
            }
        }

        durchgang = 1;
        pass = true;

        if (verticalCount >= this.cnfw || horizontalCount >= this.cnfw || diagonalOLUR >= this.cnfw || diagonalULOR >= this.cnfw) {
            this.winnerProtokol();
        }
    }

    winnerProtokol() {
        this.boundaries.push(new Boundary(Array.from(this.chips)));
        this.chips = [];
        wsSend<ws_req_new_boundary>({ command: "newBoundary" });
    }

    distance(x1: number, y1: number, x2: number, y2: number): number {
        const d0 = x2 - x1;
        const d1 = y2 - y1;
        return Math.sqrt(d0 * d0 + d1 * d1);
    }
}