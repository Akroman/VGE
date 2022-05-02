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
        console.log('points count', pointsCount);

        this.triangles = [];
        this.animatedtriangles = [];

        const origPolygon = this.polygon.clone();
        this.sortPoints2();

        this.Q = [];
        this.stackPaths = [];

        this.stackSnapshots = [];

        var p1 = this.xSorted.shift();
        var p1_p = this.topPath.shift();

        var p2 = this.xSorted.shift();
        var p2_p = this.topPath.shift();

        this.Q.push(p1);
        this.Q.push(p2);

        var prevTop = p2_p;

        for(var i = 3; i < pointsCount; i++) {
            var p_i = this.xSorted.shift();
            var p_i_p = this.topPath.shift();

            console.log(p_i_p, prevTop);
            var same_path = (p_i_p == prevTop);

            prevTop = p_i_p;

            if (same_path) {
                this.Q.push(p_i);

                // lezi na stejne strane 
                while(this.Q.length >= 3) {
                    var last1 = this.Q.pop();
                    var last2 = this.Q.pop();
                    var last3 = this.Q.pop();

                    if (p_i_p) {
                        // jdu vrchem
                        if (this.isAbove(last3, last1, last2)) {
                            this.triangles.push(new Triangle(last1, last2, last3));

                            this.Q.push(last3);
                            this.Q.push(last1);
                        }
                        else {
                            this.Q.push(last3);
                            this.Q.push(last2);
                            this.Q.push(last1);
                            break;
                        }

                    }
                    else {
                        // jdu spodem

                        if (this.isAbove(last3, last1, last2)) {
                            this.triangles.push(new Triangle(last1, last2, last3));
                            this.Q.push(last3);
                            this.Q.push(last1);
                        }
                        else {
                            this.Q.push(last3);
                            this.Q.push(last2);
                            this.Q.push(last1);
                            break;
                        }
                    }
                }
            }
            else {
                //this.Q.push(p_i);

                // lezi na opacne strane
                // uhlopricky pro vsechny ulozene body
                while(this.Q.length >= 2) {
                    console.log('tada');
                    var last2 = this.Q.shift();
                    var last1 = this.Q.shift();

                    this.triangles.push(new Triangle(last1, p_i, last2));
                    
                    this.Q.unshift(last1);
                }

                this.Q.push(p_i);
            }
            console.log(this.triangles.length);

            this.stackSnapshots.push(this.Q.slice())
        }
        console.log('Q', this.Q.length);
        console.log('Q history', this.stackSnapshots);
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

    isBelow(begin, end, testPoint) {
        var dx, dy, mx, my, cross, below;

        dx = begin.x - end.x;
        dy = begin.y - end.y;
        mx = testPoint.x - end.x;
        my = testPoint.y - end.y;

        cross = dx * my - dy * mx;
        below = (cross > 0);

        if (dy/dx < 0)
            return !below;
        else {
            return below;
        }
    }

    isAbove(begin, end, testPoint) {
        return !this.isBelow(begin, end, testPoint);
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

    sortPoints() {
        const origPolygon = this.polygon.clone();
        const pointsCount = this.polygon.allPoints.length;

        this.xSorted = []
        this.samePaths = [] // True if going over top, Fals if going over bot 

        const leftPoint = this.findMostLeftPoint();
        

        while (this.xSorted.length < pointsCount) {
            var leftestPoint = this.polygon.allPoints.shift();

            if (this.polygon.allPoints.length > 0) {
                console.log('here');
                for (var i = 0; i < this.polygon.allPoints.length + 1; i++) {
                    var currentPoint = this.polygon.allPoints.shift();

                    if (currentPoint.x < leftestPoint.x) {
                        this.polygon.allPoints.push(leftestPoint);
                        leftestPoint = currentPoint;
                    }
                    else {
                        this.polygon.allPoints.push(currentPoint);
                    }
                }
            }
            else { 
                this.polygon.allPoints.push(leftestPoint);
            }

            console.log('leftest', leftestPoint);
           
            if (this.xSorted.length == 0) {
                this.xSorted.push(leftestPoint);
                this.samePaths.push(true);
            }
            else {
                var previousPoint = this.xSorted.pop();

                var testNode = origPolygon.getNodeFromPoint(previousPoint);
                var [prevPoint, nextPoint] = Utils.getPreviousAndNextPoint(testNode);

                if (leftestPoint == nextPoint) {
                    // they are on the same path
                    this.xSorted.push(previousPoint);
                    this.xSorted.push(leftestPoint);

                    this.samePaths.push(true);
                }
                else if (leftestPoint == prevPoint) {
                    // they are on the same path
                    this.xSorted.push(previousPoint);
                    this.xSorted.push(leftestPoint);

                    this.samePaths.push(false);
                }
                else {
                    // they are on diff path
                    this.xSorted.push(previousPoint);
                    this.xSorted.push(leftestPoint);
                    
                    var last = this.samePaths.pop();
                    this.samePaths.push(last);
                    this.samePaths.push(!last);
                }
            }

            console.log('points lenght', this.polygon.allPoints);
        }

        console.log('sorted', this.xSorted);
        console.log('samePathsAsPrev', this.samePaths)
        
    }

    sortPoints2 () {
        const origPolygon = this.polygon.clone();
        const pointsCount = this.polygon.allPoints.length;

        this.xSorted = []
        this.topPath = []; // True if going over top, Fals if going over bot 
        
        const leftPoint = this.findMostLeftPoint();

        var lastTop = leftPoint;
        var lastBot = leftPoint;

        this.topPath.push(true);
        this.xSorted.push(leftPoint);

        while (this.xSorted.length < pointsCount) {
            var topNode = this.polygon.getNodeFromPoint(lastTop);
            var botNode = this.polygon.getNodeFromPoint(lastBot);

            var [topPoint, _] = Utils.getPreviousAndNextPoint(topNode);
            var [_, botPoint] = Utils.getPreviousAndNextPoint(botNode);

            if(topPoint.x < botPoint.x) {
                // jdu horni cestou

                lastTop = topPoint;
                this.topPath.push(true);
                this.xSorted.push(topPoint);
            } 
            else {
                // jdu dolni cestou

                lastBot = botPoint;
                this.topPath.push(false);
                this.xSorted.push(botPoint);
            }

            console.log('points lenght', this.xSorted);
        }

        console.log('sorted', this.xSorted);
        console.log('samePathsAsPrev', this.topPath)
        
    }
}