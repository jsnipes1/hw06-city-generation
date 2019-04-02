import {vec2, vec3, mat4} from 'gl-matrix';

export default class City {
    roadInfo : Road[];
    cellSize : number; // Smaller cell size => Higher resolution
    invCellSize : number; // 1 / cellSize
    validityGrid : boolean[];
    roadTransfs : mat4[];

    constructor(cellSize?: number) {
        if (cellSize == undefined) {
            this.cellSize = 0.5;
            this.invCellSize = 2.0;
        }
        else {
            this.cellSize = cellSize.valueOf();
            this.invCellSize = 1.0 / cellSize.valueOf();
        }

        this.roadInfo = [];
        this.roadTransfs = this.drawRoadGrid();
        this.validityGrid = [];
        this.generateValidityGrid();
    }

    // TODO: Help! Not sure how roads are tracked; is this the transformation of the center or end?
    // Is the transf being applied multiple times?
    drawRoadGrid() : mat4[] {
        let transfs : mat4[] = [];
        let m : mat4 = mat4.create();

        m = mat4.rotate(m, m, Math.PI * 0.5, vec3.fromValues(0.0, 1.0, 0.0));
        m = mat4.translate(m, m, vec3.fromValues(0.0, 2.5, 0.0));
        m = mat4.scale(m, m, vec3.fromValues(10.0, 1.0, 0.2));

        // Horizontal
        for (let i = 0; i < 3; ++i) {
            // mat4.identity(m);
            // mat4.rotate(m, m, Math.PI * 0.5, vec3.fromValues(0.0, 1.0, 0.0));
            // mat4.translate(m, m, vec3.fromValues(i * 6.0, 2.5, 0.0));
            // mat4.scale(m, m, vec3.fromValues(10.0, 1.0, 0.2));

            // mat4.translate(m, m, vec3.fromValues(0.0, 2.5, 0.0));
            transfs.push(mat4.clone(m)); // Pushes 3 different transformations even with just this line??
            
            // TODO: Fix based on info
            this.roadInfo.push(new Road(vec2.fromValues(0, 0), vec2.fromValues(1, 1)));
        }

        // Vertical
        for (let i = 0; i < 0; ++i) {
            mat4.identity(m);
            mat4.rotate(m, m, Math.PI * 0.5, vec3.fromValues(0.0, 1.0, 0.0));
            mat4.translate(m, m, vec3.fromValues(0.0, 0.2, i * 6.0));
            mat4.scale(m, m, vec3.fromValues(10.0, 1.0, 0.2));
            transfs.push(mat4.clone(m));
        }

        return transfs;
    }

    generateValidityGrid() {
        for (let i = -50 * this.invCellSize; i <= 50 * this.invCellSize; i += this.cellSize) {
            for (let j = -50 * this.invCellSize; j <= 50 * this.invCellSize; j += this.cellSize) {
                let currPos : vec2 = vec2.fromValues(i * this.cellSize, j * this.cellSize);
                let currValid : boolean = true; 
                // For each road...               
                for (let k = 0; k < this.roadInfo.length; ++k) {
                    let r : Road = this.roadInfo[k];
                    // ...find the cells it spans
                    let s : vec2 = Road.floor(r.start);
                    let e : vec2 = Road.floor(r.end);
                    // If our current cell is one of those, mark it false (invalid)...
                    if (currPos >= s || currPos <= e) {
                        currValid = false;
                        break;
                    }
                }
                // ...else, mark it true (valid)
                this.validityGrid.push(currValid.valueOf());
            }
        }
    }

    // Flatten a 2D index to 1D to appropriately access the validity array
    getValidityAt(p: vec2) : boolean {
        let i : number = p[0] + (100 * this.invCellSize + 1) * p[1];
        return this.validityGrid[i].valueOf();
    }

    // TODO: Random point generation (don't do FPD unless you want to)
}

class Road {
    start: vec2;
    end: vec2;
    roadVec: vec2; // Can calculate orientation as Math.atan2(roadVec[1], roadVec[0])
    outOfScreen: vec3 = vec3.fromValues(0, 1, 0);

    constructor(start?: vec2, end?: vec2) {
        if (start == undefined) {
            this.start = vec2.fromValues(0, 0);
        }
        else {
            this.start = vec2.create();
            vec2.copy(this.start, start);
        }

        if (end == undefined) {
            this.end = vec2.fromValues(0, 0);
        }
        else {
            this.end = vec2.create();
            vec2.copy(this.end, end);
        }

        this.roadVec = vec2.create();
        vec2.subtract(this.roadVec, vec2.clone(this.end), vec2.clone(this.start));
    }

    // Length of the road segment
    length() : number {
        return vec2.length(this.roadVec);
    }

    // Vector on the terrain that is normal to the road; negate for other direction
    inPlaneNormal() : vec2 {
        let roadVec3 : vec3 = vec3.fromValues(this.roadVec[0], 0.0, this.roadVec[1]);
        let xProd : vec3 = vec3.create();
        vec3.cross(xProd, this.outOfScreen, roadVec3);
        vec3.normalize(xProd, xProd);
        return vec2.fromValues(xProd[0], xProd[1]);
    }

    static floor(v: vec2) : vec2 {
        return vec2.fromValues(Math.floor(v[0].valueOf()), Math.floor(v[1].valueOf()));
    }
}