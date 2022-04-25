import Utils from './Utils';


/**
 * Class implementing triangulation algorithms
 */
export default class Triangulator {
    /**
     * @param {Polygon} polygon
     */
    constructor(polygon) {
        this.polygon = polygon;
        this.lines = [];
    }


    /**
     * Set a polygon and reset generated triangles
     * @param {Polygon} polygon
     * @returns {Triangulator}
     */
    setPolygon(polygon) {
        this.polygon = polygon;
        this.lines = [];
        return this;
    }


    /**
     * Ear clipping algorithm implementation
     */
    earClipping() {
        const pointsCount = this.polygon.allPoints.length;
        this.polygon.initEarClipping();

        while (this.lines.length < pointsCount - 2) {
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

            this.lines.push({
                from: prevPoint,
                to: nextPoint
            });
        }
    }
}