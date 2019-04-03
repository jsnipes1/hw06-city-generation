import {vec2, vec3, mat4} from 'gl-matrix';

export default class City {
    roadInfo : Road[];
    cellSize : number; // Smaller cell size => Higher resolution
    invCellSize : number; // 1.0 / cellSize
    validityGrid : boolean[];
    nValid : number;
    nBuildings : number; // Number of buildings to randomly place in the scene
    allRandomPoints : vec2[];
    selectedRandomPoints : vec2[];
    roadTransfs : mat4[];

    constructor(cellSize?: number, nBuildings?: number) {
        if (cellSize == undefined) {
            this.cellSize = 0.5;
            this.invCellSize = 2.0;
        }
        else {
            this.cellSize = cellSize.valueOf();
            this.invCellSize = 1.0 / cellSize.valueOf();
        }

        if (nBuildings == undefined) {
            this.nBuildings = 20;
        }
        else {
            this.nBuildings = nBuildings;
        }

        this.nValid = 0;

        this.roadInfo = [];
        this.roadTransfs = this.drawRoadGrid();

        this.validityGrid = [];
        this.generateValidityGrid();

        this.allRandomPoints = [];
        this.generateRandomPoints();

        this.selectedRandomPoints = [];
        this.selectPoints();
    }

    // Draw a lattice of roads using instanced rendering
    drawRoadGrid() : mat4[] {
        let transfs : mat4[] = [];
        let m : mat4 = mat4.create();

        // Horizontal
        for (let i = 0; i < 10; ++i) {
            mat4.identity(m);
            mat4.rotate(m, m, Math.PI * 0.5, vec3.fromValues(0.0, 1.0, 0.0));
            mat4.translate(m, m, vec3.fromValues(i * 6.0 - 43.0, 0.02, 0.0));
            mat4.scale(m, m, vec3.fromValues(100.0, 1.0, 0.2));

            transfs.push(mat4.clone(m));
            
            // "Start" and "end" here represent the thickness of the road
            // It spans the entirety of the plane along the x direction
            let p : number = i * 6.0 - 43.0;
            this.roadInfo.push(new Road(vec2.fromValues(-50, p - 0.1), vec2.fromValues(50, p + 0.1)));
        }

        // Vertical
        for (let i = 0; i < 14; ++i) {
            mat4.identity(m);
            mat4.rotate(m, m, Math.PI * 0.5, vec3.fromValues(0.0, 1.0, 0.0));
            mat4.translate(m, m, vec3.fromValues(-16.0, 0.02, i * 6.0 - 45.0));
            mat4.scale(m, m, vec3.fromValues(0.2, 1.0, 55.0));

            transfs.push(mat4.clone(m));

            // Same as above but spans entirety of plane along z direction
            let p : number = i * 6.0 - 45.0;
            this.roadInfo.push(new Road(vec2.fromValues(p - 0.1, -50), vec2.fromValues(p + 0.1, 50)));
        }

        return transfs;
    }

    // Generate a high-resolution grid of booleans that checks for open land
    generateValidityGrid() {
        // Grid size is (100 * invCellSize + 1) x (100 * invCellSize + 1)
        for (let i = -50 * this.invCellSize; i <= 50 * this.invCellSize; ++i) {
            for (let j = -50 * this.invCellSize; j <= 50 * this.invCellSize; ++j) {
                let currPos : vec2 = vec2.fromValues(i * this.cellSize, j * this.cellSize);
                let currValid : boolean = true; 
                // For each road...               
                for (let k = 0; k < this.roadInfo.length; ++k) {
                    let r : Road = this.roadInfo[k];
                    // ...find the cells it spans
                    let s : vec2 = Road.floor(r.start);
                    let e : vec2 = Road.floor(r.end);
                    // If our current cell is one of those or contains water, mark it false (invalid)
                    if (currPos >= s || currPos <= e || this.isWater(currPos)) {
                        currValid = false;
                        break; // Only breaks out of k loop
                    }
                }
                // Else, mark it true (valid)
                this.validityGrid.push(currValid.valueOf());
            }
        }
    }

    // Get the validity value by passing in a 2D index
    getValidityAt(p: vec2) : boolean {
        // Flatten a 2D index to 1D to appropriately access the validity array
        let i : number = p[0] + (100 * this.invCellSize + 1) * p[1];
        return this.validityGrid[i];
    }

    // Random point generation within each valid cell
    generateRandomPoints() {
        for (let i = 0; i < this.validityGrid.length; ++i) {
            if (this.validityGrid[i]) {
                let x : number = Math.floor(i / (100 * this.invCellSize + 1));
                let y : number = i % (100 * this.invCellSize + 1);
                this.allRandomPoints.push(vec2.fromValues(x + this.cellSize * Math.random(), y + this.cellSize * Math.random()));
            }
        }
    }

    // Randomly select some of the generated points
    selectPoints() {
        for (let i = 0; i < this.nBuildings; ++i) {
            let randIdx : number = Math.floor(this.allRandomPoints.length * Math.random());
            this.selectedRandomPoints.push(this.allRandomPoints[randIdx]);
        }
    }

    /////////////// Access terrain info on CPU ///////////////
    hash2D(x: vec2) : number {
        let i : number = vec2.dot(x, vec2.fromValues(123.4031, 46.5244876));
        let j : number = Math.sin(i * 7.13) * 268573.103291;
        return j - Math.floor(j);
    }

    vecFract(a: vec2) : vec2 {
        return vec2.fromValues(a[0] - Math.floor(a[0]), a[1] - Math.floor(a[1]));
    }

    mix(a: number, b: number, t: number) : number {
        return a * (1.0 - t) + b * t;
    }

    // 2D noise
    noise(p: vec2) : number {
        let corner : vec2 = vec2.create();
        vec2.floor(corner, p);
        let inCell : vec2 = this.vecFract(p);

        let brCorner : vec2 = vec2.create();
        vec2.add(brCorner, vec2.clone(corner), vec2.fromValues(1.0, 0.0));

        let bL : number = this.hash2D(corner);
        let bR : number = this.hash2D(brCorner);
        let bottom : number = this.mix(bL, bR, inCell[0]);

        let tCorner : vec2 = vec2.create();
        vec2.add(tCorner, vec2.clone(corner), vec2.fromValues(0.0, 1.0));
        let trCorner : vec2 = vec2.create();
        vec2.add(trCorner, tCorner, vec2.fromValues(1.0, 0.0));

        let tL : number = this.hash2D(tCorner);
        let tR : number = this.hash2D(trCorner);
        let top : number = this.mix(tL, tR, inCell[0]);

        return this.mix(bottom, top, inCell[0]);
    }

    fbm(q: vec2) : number {
        let acc : number = 0.0;
        let freqScale : number = 2.0;
        let invScale : number = 1.0 / freqScale;
        let freq : number = 1.0;
        let amp : number = 1.0;

        for (let i = 0; i < 3; ++i) {
            freq *= freqScale;
            amp *= invScale;
            let qScale : vec2 = vec2.create();
            vec2.scale(qScale, q, freq);
            acc += this.noise(qScale) * amp;
        }
        return acc;
    }

    // Terrain height map computed using multi-octave 2D FBM
    getTerrain(q: vec2) : number {
        let fbm1 : vec2 = vec2.create();
        vec2.subtract(fbm1, vec2.clone(q), vec2.fromValues(0.2, 0.2));

        let fbm2 : vec2 = vec2.create();
        vec2.add(fbm2, vec2.clone(q), vec2.fromValues(25.2, -22.8));

        let p : vec2 = vec2.fromValues(this.fbm(fbm1), this.fbm(fbm2));
        return Math.min(Math.max(2.0 * this.fbm(p) - 0.3, 0.0), 1.0);
    }

    // Check if terrain ahead is water or land
    isWater(q: vec2) : boolean {
        return (this.getTerrain(q) < 0.57);
    }
}

/////////////// ROAD CLASS ///////////////
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

/////////////// POLYGON CLASS ///////////////
class Polygon {
    numSides: number;
    vertices: vec2[];
    height: number;
    radPerAngle: number;
    center: vec2;

    constructor(numSides: number, height: number, center: vec2) {
        this.numSides = numSides;
        this.height = height;
        this.center = center;

        this.vertices = [];
        let radius : number = 1.0 / (2.0 * Math.sin(Math.PI / numSides));
        let startVert : vec2 = vec2.fromValues(0, 0);
        vec2.add(startVert, center, vec2.fromValues(radius, 0));
        this.vertices.push(startVert);

        // Assume a regular polygon
        this.radPerAngle = Math.PI * (numSides - 2) / numSides;

        // Generate the remainder of the vertices, assuming unit side length
        for (let i = 1; i < numSides; ++i) {
            let extAngle = Math.PI - this.radPerAngle;
            let nextPos = vec2.fromValues(0, 0);
            vec2.add(nextPos, this.vertices[i - 1], vec2.fromValues(Math.cos(i * extAngle), Math.sin(i * extAngle)));
            this.vertices.push(nextPos);
        }
    }
}

/////////////// BUILDING CLASS ///////////////
class Building {
    xzPos: vec2;
    startHeight: number;
    floorPlan: Polygon[];
    footprint: Polygon; // Not sure if I'll need this to store the union?

    constructor(xzPos: vec2, startHeight: number) {
        this.xzPos = xzPos;
        this.startHeight = startHeight;

        // Add a random polygon for the top floor
        this.floorPlan = [];
        this.floorPlan.push(new Polygon(this.randomNGon(7), startHeight, xzPos));
    }

    generateFloor(nFromTop: number) {
        // Randomize story height
        let floorHeight : number = 4 * Math.random() + 1;

        // Height from the ground of the current floor
        let currHeight = this.startHeight - nFromTop * floorHeight;

        let mostRecent : Polygon = this.getLatestPoly();

        // Add a new random polygon to the floor plan, with its center at one of the previous polygon's vertices
        let addedPoly : Polygon = new Polygon(this.randomNGon(7), currHeight, 
                                  mostRecent.vertices[this.randomNGon(mostRecent.vertices.length)]);
        this.floorPlan.push(addedPoly);

        // HELP: How to union this polygon to the others?
    }

    // Get the most recently pushed polygon in the array
    getLatestPoly() : Polygon {
        return this.floorPlan[this.floorPlan.length - 1];
    }

    // Random integer from 3 to maxValue + 2 representing the number of sides of the generated polygon
    randomNGon(maxValue: number) : number {
        return Math.floor(Math.random() * maxValue) + 3;
    }
}