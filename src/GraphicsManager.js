import * as PIXI from 'pixi.js';
import Polygon from './Polygon';
import Point from './Point';
import Triangulator from './Triangulator';


/**
 * Class for creating and drawing lines and polygons
 */
export default class GraphicsManager {
    constructor() {
        // Constants
        this.POLYGON_END_THRESHOLD = 10;
        this.POLYGON_FILL_COLOR = 0x444444;

        this.LINE_WIDTH = 2;
        this.LINE_COLOR = 0xffffff;

        this.TRIANGULATION_INITIAL_LINE_DISTANCE = 1;
        this.TRIANGULATION_LINE_END_THRESHOLD = 2;
        this.TRIANGULATION_LINE_COLOR = 0xff0000;
        this.TRIANGULATION_TRIANGLE_FILL_COLOR = 0x83b87d;
        this.TRIANGULATION_EAR_FILL_COLOR = 0xfa9052;
        this.TRIANGULATION_LINE_ENDS_FILL_COLOR = 0xa2a1ff;
        this.TRIANGULATION_LINE_CIRCLE_RADIUS = 8;

        this.initLineDrawing();

        this.triangulator = new Triangulator(new Polygon());
        this.initTriangulation();

        // Graphics
        this.lineGraphics = new PIXI.Graphics();
        this.tempLineGraphics = new PIXI.Graphics();
        this.polygonGraphics = new PIXI.Graphics();
        this.triangulationGraphics = new PIXI.Graphics();

        this.clearDrawing();
    }


    /**
     * Get array of all graphic objects
     * @returns {PIXI.Graphics[]}
     */
    get graphics() {
        return [this.lineGraphics, this.tempLineGraphics, this.polygonGraphics, this.triangulationGraphics];
    }


    /**
     * Initialize variables for line drawing
     * @returns {GraphicsManager}
     */
    initLineDrawing() {
        // Indicates that drawing is in progress
        this.lineDrawingStarted = false;

        // Points
        this.fromPoint = new Point(0, 0);
        this.currPoint = new Point(0, 0);
        this.points = [];

        return this;
    }


    /**
     * Clear all drawn objects and reset line styles
     * @returns {GraphicsManager}
     */
    clearDrawing() {
        this.graphics.forEach((graphic) => graphic.clear().lineStyle(this.LINE_WIDTH, this.LINE_COLOR));
        this.triangulationGraphics.lineStyle(this.LINE_WIDTH, this.TRIANGULATION_LINE_COLOR);
        this.polygonGraphics.beginFill(this.POLYGON_FILL_COLOR);

        return this;
    }


    /**
     * Starts drawing of a new polygon
     * @param {Point} pointFrom
     */
    startLineDrawing(pointFrom) {
        this.fromPoint = pointFrom.clone();
        this.currPoint = pointFrom.clone();
        this.points.push(pointFrom.clone());
        this.lineDrawingStarted = true;
    }


    /**
     * Finishes drawing, draws the polygon and sets drawn polygon to the triangulator
     */
    endLineDrawing() {
        const polygon = new Polygon(this.points.slice(0, this.points.length - 1));
        this.clearDrawing().polygonGraphics.drawPolygon(polygon);
        this.triangulator.polygon = polygon;
        this.initLineDrawing();
    }


    /**
     * Draws a permanent line between last point and a given point
     * @param {Point} pointTo
     */
    drawLine(pointTo) {
        const endPoint = this.checkPolygonEndPoint(pointTo);

        // Polygon has to have at least 2 points and only unique points
        if ((endPoint.equals(this.fromPoint) && this.points.length <= 2) || this.points.some((point) => point.equals(pointTo))) {
            return;
        }

        this.lineGraphics.moveTo(this.currPoint.x, this.currPoint.y).lineTo(endPoint.x, endPoint.y);

        this.points.push(endPoint.clone());
        this.currPoint = endPoint.clone();
    }


    /**
     * Draws a line from the last point to a given point
     * Used for drawing line between last point and current mouse position (graphics gets cleared everytime)
     * @param {Point} pointTo
     */
    drawTemporaryLine(pointTo) {
        const endPoint = this.checkPolygonEndPoint(pointTo);
        this.tempLineGraphics
            .clear()
            .lineStyle(this.LINE_WIDTH, this.LINE_COLOR)
            .moveTo(this.currPoint.x, this.currPoint.y)
            .lineTo(endPoint.x, endPoint.y);
    }


    /**
     * Checks if given point is in threshold area of starting point
     * @param {Point} pointTo
     */
    checkPolygonEndThreshold(pointTo) {
        return this.fromPoint.isPointInThreshold(pointTo, this.POLYGON_END_THRESHOLD);
    }


    /**
     * Returns the starting point if pointTo is in threshold to be the ending point, else returns pointTo
     * @param {Point} pointTo
     */
    checkPolygonEndPoint(pointTo) {
        return this.checkPolygonEndThreshold(pointTo) ? this.fromPoint : pointTo;
    }


    /**
     * Initialize triangulation variables
     */
    initTriangulation() {
        this.triangulator.polygon = new Polygon();
        this.triangulationInProgress = false;
        this.currTriangle = null;
        this.triangulationLineDistance = this.TRIANGULATION_INITIAL_LINE_DISTANCE;
    }


    /**
     * Run triangulation algorithm and start triangulation animation
     */
    triangulate() {
        console.log('triangulate ear clipping');

        this.triangulator.earClipping();
        this.triangulationInProgress = true;
        this.currTriangle = this.triangulator.triangleToAnimate;
        this.triangulationLineDistance = this.TRIANGULATION_INITIAL_LINE_DISTANCE;
    }

    triangulateConvex() {
        console.log('triangulate convex');

        this.triangulator.convexTriangulate();
        this.triangulationInProgress = true;
        this.currTriangle = this.triangulator.triangleToAnimate;
        this.triangulationLineDistance = this.TRIANGULATION_INITIAL_LINE_DISTANCE;
    }

    triangulateMonotone() {
        console.log('triangulate greedy monotone');

        this.triangulator.greedyMonotoneTriangulate();
        this.triangulationInProgress = true;
        this.currTriangle = this.triangulator.triangleToAnimate;
        this.triangulationLineDistance = this.TRIANGULATION_INITIAL_LINE_DISTANCE;

    }

    sweepline() {
        console.log('trapezodiation using sweepline');
    }


    /**
     * Draw triangles that have already been animated by animateTriangulation
     */
    drawAnimatedTriangles() {
        this.triangulationGraphics.clear();
        this.triangulator.animatedtriangles.reverse().forEach((triangle) => {
            this.triangulationGraphics
                .lineStyle()
                .beginFill(this.TRIANGULATION_TRIANGLE_FILL_COLOR)
                .drawPolygon(triangle)
                .lineStyle(this.LINE_WIDTH, this.TRIANGULATION_LINE_COLOR)
                .moveTo(triangle.from.x, triangle.from.y)
                .lineTo(triangle.to.x, triangle.to.y)
        });
    }


    /**
     * Draw the triangulation animation
     * @param {number} delta
     * @param {number} speed
     */
    animateTriangulation(delta, speed) {
        this.drawAnimatedTriangles();

        // Check if there are any triangles to animate
        if (!this.triangulator.triangles.length) {
            this.triangulationInProgress = false;
            this.triangulator.addAnimatedTriangle(this.currTriangle);
            this.drawAnimatedTriangles();
            return;
        }

        const from = this.currTriangle.from,
            ear = this.currTriangle.ear,
            to = this.currTriangle.to;
        let lineEnd = from.getPointInDirection(to, this.triangulationLineDistance);

        // Update line distance
        this.triangulationLineDistance += delta * speed;

        // If currently animated triangle is nearing it's end, finish drawing it and get next triangle
        if (to.isPointInThreshold(lineEnd, this.TRIANGULATION_LINE_END_THRESHOLD * speed)) {
            lineEnd = to;
            this.triangulationLineDistance = this.TRIANGULATION_INITIAL_LINE_DISTANCE;
            this.triangulator.addAnimatedTriangle(this.currTriangle);
            this.currTriangle = this.triangulator.triangleToAnimate;
        }

        // Draw ear
        this.triangulationGraphics
            .lineStyle(this.LINE_WIDTH, this.TRIANGULATION_EAR_FILL_COLOR)
            .beginFill(this.TRIANGULATION_EAR_FILL_COLOR)
            .drawCircle(ear.x, ear.y, this.TRIANGULATION_LINE_CIRCLE_RADIUS);

        // Draw line ends
        this.triangulationGraphics
            .lineStyle(this.LINE_WIDTH, this.TRIANGULATION_LINE_ENDS_FILL_COLOR)
            .beginFill(this.TRIANGULATION_LINE_ENDS_FILL_COLOR)
            .drawCircle(from.x, from.y, this.TRIANGULATION_LINE_CIRCLE_RADIUS)
            .drawCircle(to.x, to.y, this.TRIANGULATION_LINE_CIRCLE_RADIUS);

        // Draw currently animated line
        this.triangulationGraphics
            .lineStyle(this.LINE_WIDTH, this.TRIANGULATION_LINE_COLOR)
            .moveTo(from.x, from.y)
            .lineTo(lineEnd.x, lineEnd.y);
    }
}