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
    minX = Number.MAX_VALUE;
    minY = Number.MAX_VALUE;
    maxX = Number.MIN_VALUE;
    maxY = Number.MIN_VALUE;
    width: number;
    height: number;

    constructor(oc: Chip[]) {
        this.boundChip = oc;

        for (let c of this.boundChip) {
            if (c.x < this.minX) {
                this.minX = c.x;
            }
            if (c.y < this.minY) {
                this.minY = c.y;
            }
            if (c.x > this.maxX) {
                this.maxX = c.x;
            }
            if (c.y > this.maxY) {
                this.maxY = c.y;
            }
        }

        this.maxX = this.maxX;
        this.minX = this.minX;
        this.maxY = this.maxY;
        this.minY = this.minY;
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
    shape: ws_player_shape
    shapePath2D: Path2D;
    playerNumber: number;
    isPlayerReady: boolean;

    constructor(playerName: string, color: ws_color, playerIcon: ws_player_shape, playerNubmer: number, isPlayerReady: boolean) {
        this.name = playerName;
        this.color = color;
        this.colorRGB = colors[color];
        this.shape = playerIcon;
        this.shapePath2D = shapesPath2D[playerIcon];
        this.playerNumber = playerNubmer;
        this.isPlayerReady = isPlayerReady
    }

    getWSData(): ws_player_data {
        return { color: this.color, name: this.name, isPlayerRead: this.isPlayerReady, playerNumber: this.playerNumber, shape: this.shape };
    }

    setFromData(newPlayerData: ws_player_data) {
        this.name = newPlayerData.name;
        this.color = newPlayerData.color;
        this.colorRGB = colors[newPlayerData.color];
        this.shape = newPlayerData.shape;
        this.shapePath2D = shapesPath2D[this.shape];
        this.playerNumber = newPlayerData.playerNumber;
        this.isPlayerReady = newPlayerData.isPlayerRead;
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

export const shapesPath2D: { [key: string]: Path2D } = {
    "square": new Path2D(shapePaths.get("square")),
    "square_filled": new Path2D(shapePaths.get("square_filled")),
    "circle": new Path2D(shapePaths.get("circle")),
    "circle_filled": new Path2D(shapePaths.get("circle_filled")),
    "triangle": new Path2D(shapePaths.get("triangle")),
    "triangle_filled": new Path2D(shapePaths.get("triangle_filled")),
    "cross": new Path2D(shapePaths.get("cross"))
};

export class Game {
    players: Player[];
    boundaries: Boundary[] = [];
    chips: Chip[] = [];

    s = 16;
    mx = 0;
    my = 0;
    isDragging = false;
    lastX = 0;
    lastY = 0;

    scaledShapes: { [key: string]: Path2D } = {};
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement, players: Player[]) {
        this.players = players;
        this.chips.push(new Chip(0, 0, 0));
        this.canvasZoom(1, 0, 0);
        this.canvas = canvas;
        const c = canvas.getContext("2d");
        if (!c)
            throw new Error("No Context");
        this.ctx = c;


        canvas.addEventListener("mousedown", (e) => {
            e.preventDefault();
            this.isDragging = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
        });



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
        });


        canvas.addEventListener("touchmove", e => {
            e.preventDefault();

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
        });

        canvas.addEventListener("touchend", e => {
            for (const t of e.changedTouches)
                delete touches[t.identifier];
        });

        canvas.addEventListener("wheel", e => {
            e.preventDefault();
            const val = 1 - e.deltaY / 512;
            this.canvasZoom(val, e.clientX, e.clientY);
            this.render()
        });

        canvas.addEventListener("mouseup", () => {
            this.isDragging = false;
        });
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
        this.s = clamp(this.s * factor, 16, 128);
        const newX = tx / this.s;
        const newY = ty / this.s;
        this.drag((newX - prevX) * this.s, (newY - prevY) * this.s);
        const dm = new DOMMatrix([this.s, 0, 0, this.s, 0, 0]);
        for (let shape in shapesPath2D) {
            const p = new Path2D();
            p.addPath(shapesPath2D[shape], dm);
            this.scaledShapes[shape] = p;
        }
    };

    render() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        this.ctx.resetTransform();
        this.ctx.scale(dpr, dpr);
        this.ctx.fillStyle = "rgb(10, 10, 10)";
        this.ctx.fillRect(0, 0, width, height);

        this.ctx.lineWidth = 0.5;
        this.ctx.strokeStyle = "rgba(100, 100, 100, 0.5)";
        let x = this.mx % this.s;
        let y = this.my % this.s;
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

        this.ctx.fillStyle = "rgb(100, 10, 10)";

        this.ctx.fillRect(this.mx, this.my, this.s, this.s);
    }


    distance(x1: number, y1: number, x2: number, y2: number): number {
        const d0 = x2 - x1;
        const d1 = y2 - y1;
        return Math.sqrt(d0 * d0 + d1 * d1);
    }
}