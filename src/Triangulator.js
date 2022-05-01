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
        this.animatedtriangles = [];
    }


    /**
     * Get next triangle to be animated
     * @returns {Triangle}
     */
    get triangleToAnimate() {
        return this.triangles.shift();
    }


    /**
     * Add triangle that has already finished animation
     * @param {Triangle} triangle
     */
    addAnimatedTriangle(triangle) {
        this.animatedtriangles.push(triangle);
    }


    /**
     * Ear clipping algorithm implementation
     */
    earClipping() {
        const pointsCount = this.polygon.allPoints.length;
        const origPolygon = this.polygon.clone();
        this.triangles = [];
        this.animatedtriangles = [];
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

    convexTriangulate() {
        const pointsCount = this.polygon.allPoints.length;
        const origPolygon = this.polygon.clone();

        this.triangles = [];
        this.animatedtriangles = [];

        const selectedPoint = origPolygon.allPoints.shift();
        const selectedNode = this.polygon.getNodeFromPoint(selectedPoint);
        
        var secondPoint, z;
        var [x, firstPoint] = Utils.getPreviousAndNextPoint(selectedNode);
        var [y, secondPoint] = Utils.getPreviousAndNextPoint(this.polygon.getNodeFromPoint(firstPoint));


        while(this.triangles.length < pointsCount - 2) {
            console.log(selectedPoint, firstPoint, secondPoint);

            this.triangles.push(new Triangle(selectedPoint, firstPoint, secondPoint));

            firstPoint = secondPoint;
            [z, secondPoint] = Utils.getPreviousAndNextPoint(this.polygon.getNodeFromPoint(secondPoint));
        }

        this.polygon = origPolygon;
    }

    greedyMonotoneTriangulate() {
        const pointsCount = this.polygon.allPoints.length;
        const leftPoint = this.findMostLeftPoint();

        this.triangles = [];
        this.Q = [];
        this.animatedtriangles = [];
        this.usedPoints = [];
        
        var lastTop, lastBot;
        var topPoint, botPoint, _;
        var currentPoint;
        var lastWasTop = true;

        const leftNode = this.polygon.getNodeFromPoint(leftPoint);
        [topPoint, botPoint] = Utils.getPreviousAndNextPoint(leftNode);

        var topNode, botNode;
        lastTop = leftPoint;
        lastBot = botPoint;

        //this.triangles.push(new Triangle(leftPoint, topPoint, botPoint));

        this.Q.push(leftPoint);
        this.Q.push(botPoint);

        var goingTop = false;

        while(this.triangles.length < pointsCount - 2) {
            lastWasTop = goingTop;

            topNode = this.polygon.getNodeFromPoint(lastTop);
            botNode = this.polygon.getNodeFromPoint(lastBot);

            [topPoint, _] = Utils.getPreviousAndNextPoint(topNode);
            [_, botPoint] = Utils.getPreviousAndNextPoint(botNode);

            if (topPoint.x < botPoint.x) {
                botPoint = lastBot;
                goingTop = true;
                currentPoint = topPoint;
            }
            else {
                topPoint = lastTop;
                goingTop = false;
                currentPoint = botPoint;
            }

            if (this.usedPoints.length > pointsCount) {
                console.log('error');
                break;
            }

            console.log(this.triangles, this.Q, lastWasTop, goingTop, currentPoint);

            // same chain
            if (lastWasTop == goingTop) {
                this.Q.push(currentPoint);
                while (this.Q.length >= 3) {
                    var last1 = this.Q.pop();
                    var last2 = this.Q.pop();

                    console.log(last2, last1, currentPoint, this.find_angle(last2, last1, currentPoint));

                    if (this.find_angle(last2, last1, currentPoint) < 180) {
                        this.triangles.push(new Triangle(last2, last1, currentPoint));
                        this.Q.push(last2);
                    }
                    else {
                        this.Q.push(last2);
                        this.Q.push(last1);

                        console.log('break same chain,', this.Q);
                        break;
                    }

                    console.log('same chain,', this.Q);
                }
            }
            // different chain
            else {
                while (this.Q.length >= 2) {
                    var last1 = this.Q.pop();
                    var last2 = this.Q.pop();
                    
                    this.triangles.push(new Triangle(last2, last1, currentPoint));

                    this.Q.push(last2);
                }

                this.Q.push(currentPoint);

                console.log('different chain,', this.Q);
            }

            console.log('triangles length', this.triangles.length);

            this.usedPoints.push(currentPoint);
            console.log(this.usedPoints.length);

            lastTop = topPoint;
            lastBot = botPoint;
        }
    }

    findMostLeftPoint() {
        var currentPoint = null;
        
        this.polygon.allPoints.forEach(point => {
            console.log(point);

            if (currentPoint === null || point.x < currentPoint.x) {
                currentPoint = point;
            }
        });

        return currentPoint;
    }

    /*
    * Calculates the angle ABC (in radians) 
    *
    * A first point, ex: {x: 0, y: 0}
    * C second point
    * B center point
    */
    find_angle(p0, c, p1) {
        var p0c = Math.sqrt(Math.pow(c.x-p0.x,2)+
                            Math.pow(c.y-p0.y,2)); // p0->c (b)   
        var p1c = Math.sqrt(Math.pow(c.x-p1.x,2)+
                            Math.pow(c.y-p1.y,2)); // p1->c (a)
        var p0p1 = Math.sqrt(Math.pow(p1.x-p0.x,2)+
                             Math.pow(p1.y-p0.y,2)); // p0->p1 (c)

        return this.toDegrees(Math.acos((p1c*p1c+p0c*p0c-p0p1*p0p1)/(2*p1c*p0c)));
    }

    toDegrees(radians) {
        return 360 * radians / (2 * Math.PI)
    }
}