import Utils from './Utils';
import Triangle from './Triangle';


/**
 * Class implementing triangulation algorithms
 */
export default class Triangulator {
    /**
     * @param {Polygon} polygon
     */
    constructor(polygon) {
        this.polygon = polygon;
        this.triangles = [];
        this.animatedTriangles = [];
    }


    /**
     * Get next triangle to be animated
     * @returns {Triangle}
     */
    get triangleToAnimate() {
        return this.triangles.shift();
    }


    /**
     * @returns {Point[]}
     */
    get pointStack() {
        return this.stackSnapshots.shift();
    }


    /**
     * Add triangle that has already finished animation
     * @param {Triangle} triangle
     */
    addAnimatedTriangle(triangle) {
        this.animatedTriangles.push(triangle);
    }


    /**
     * Ear clipping algorithm implementation
     */
    earClipping() {
        const pointsCount = this.polygon.allPoints.length;
        const origPolygon = this.polygon.clone();
        this.triangles = [];
        this.animatedTriangles = [];
        this.polygon.initEarClipping();

        while (this.triangles.length < pointsCount - 2) {
            // Get next ear and it's neighbour points
            const ear = this.polygon.earPoints.shift();
            const earNode = this.polygon.getNodeFromPoint(ear);
            const [prevPoint, nextPoint] = Utils.getPreviousAndNextPoint(earNode);

            // Remove the ear from all lists
            this.polygon.allPoints.delete(ear);
            this.polygon.convexPoints.delete(ear);
            this.polygon.points = this.polygon.allPoints
                .toArray()
                .map((point) => [point.x, point.y])
                .flat();

            // Update relationship for neighbour points
            this.polygon
                .testNodeForEar(this.polygon.getNodeFromPoint(prevPoint))
                .testNodeForEar(this.polygon.getNodeFromPoint(nextPoint));

            this.triangles.push(new Triangle(prevPoint, ear, nextPoint));
        }

        this.polygon = origPolygon;
    }


    /**
     * Convex triangulation algorithm implementation
     */
    convexTriangulate() {
        const pointsCount = this.polygon.allPoints.length;
        const origPolygon = this.polygon.clone();

        this.triangles = [];
        this.animatedTriangles = [];

        const selectedPoint = origPolygon.allPoints.shift();
        const selectedNode = this.polygon.getNodeFromPoint(selectedPoint);

        let z;
        let [x, firstPoint] = Utils.getPreviousAndNextPoint(selectedNode);
        let [y, secondPoint] = Utils.getPreviousAndNextPoint(this.polygon.getNodeFromPoint(firstPoint));

        while (this.triangles.length < pointsCount - 2) {
            this.triangles.push(new Triangle(selectedPoint, firstPoint, secondPoint));

            firstPoint = secondPoint;
            [z, secondPoint] = Utils.getPreviousAndNextPoint(this.polygon.getNodeFromPoint(secondPoint));
        }
    }


    /**
     * Monotone triangulation algorithm implementation
     */
    greedyMonotoneTriangulate() {
        let last2;
        let last1;
        const pointsCount = this.polygon.allPoints.length;

        this.triangles = [];
        this.animatedTriangles = [];

        this.sortPoints2();

        this.Q = [];

        this.stackSnapshots = [];

        const p1 = this.xSorted.shift();

        this.topPath.shift();
        const p2 = this.xSorted.shift();
        const p2_p = this.topPath.shift();

        this.Q.push(p1);
        this.Q.push(p2);

        let prevTop = p2_p;

        for (let i = 2; i < pointsCount; i++) {
            const p_i = this.xSorted.shift();
            const p_i_p = this.topPath.shift();

            const same_path = (p_i_p === prevTop);

            prevTop = p_i_p;

            if (same_path) {
                this.Q.push(p_i);

                // lezi na stejne strane
                while (this.Q.length >= 3) {
                    last1 = this.Q.pop();
                    last2 = this.Q.pop();
                    const last3 = this.Q.pop();

                    if (p_i_p) {
                        // jdu vrchem
                        if (this.isBelow(last3, last1, last2)) {
                            this.triangles.push(new Triangle(last1, last2, last3));

                            this.Q.push(last3);
                            this.Q.push(last1);

                            this.stackSnapshots.push(this.Q.slice());
                        } else {
                            this.Q.push(last3);
                            this.Q.push(last2);
                            this.Q.push(last1);
                            break;
                        }
                    } else {
                        // jdu spodem
                        if (!this.isBelow(last3, last1, last2)) {
                            this.triangles.push(new Triangle(last1, last2, last3));

                            this.Q.push(last3);
                            this.Q.push(last1);

                            this.stackSnapshots.push(this.Q.slice());
                        } else {
                            this.Q.push(last3);
                            this.Q.push(last2);
                            this.Q.push(last1);
                            break;
                        }
                    }
                }
            } else {
                //this.Q.push(p_i);

                // lezi na opacne strane
                // uhlopricky pro vsechny ulozene body
                while (this.Q.length >= 2) {
                    last2 = this.Q.shift();
                    last1 = this.Q.shift();

                    this.triangles.push(new Triangle(last1, last2, p_i));
                    this.Q.unshift(last1);

                    this.stackSnapshots.push(this.Q.slice());
                }
                this.Q.push(p_i);
            }
        }
    }


    findMostLeftPoint() {
        let currentPoint = null;

        this.polygon.allPoints.forEach(point => {
            if (currentPoint === null || point.x < currentPoint.x) {
                currentPoint = point;
            }
        });

        return currentPoint;
    }


    isBelow(point1, point2, currPoint) {
        let cross, below;

        const dxc = currPoint.x - point1.x;
        const dyc = currPoint.y - point1.y;

        const dxl = point2.x - point1.x;
        const dyl = point2.y - point1.y;

        cross = dxc * dyl - dyc * dxl;

        below = (cross > 0);

        return below;
    }


    sortPoints2 () {
        const pointsCount = this.polygon.allPoints.length;

        this.xSorted = []
        this.topPath = []; // True if going over top, Fals if going over bot

        const leftPoint = this.findMostLeftPoint();

        let lastTop = leftPoint;
        let lastBot = leftPoint;

        this.topPath.push(true);
        this.xSorted.push(leftPoint);

        while (this.xSorted.length < pointsCount) {
            const topNode = this.polygon.getNodeFromPoint(lastTop);
            const botNode = this.polygon.getNodeFromPoint(lastBot);

            let topPoint, botPoint, _;
            [topPoint, _] = Utils.getPreviousAndNextPoint(topNode);
            [_, botPoint] = Utils.getPreviousAndNextPoint(botNode);

            if (topPoint.x < botPoint.x) {
                // jdu horni cestou
                lastTop = topPoint;
                this.topPath.push(true);
                this.xSorted.push(topPoint);
            } else {
                // jdu dolni cestou
                lastBot = botPoint;
                this.topPath.push(false);
                this.xSorted.push(botPoint);
            }
        }
    }
}