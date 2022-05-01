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

    }
}