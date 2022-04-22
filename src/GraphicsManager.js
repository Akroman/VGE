import * as PIXI from 'pixi.js';
import Polygon from "./Polygon";


/**
 * Class for creating and drawing lines and polygons
 */
export default class GraphicsManager {
    constructor() {
        // Constants
        this.POLYGON_END_THRESHOLD = 10;
        this.LINE_WIDTH = 1.5;
        this.LINE_COLOR = 0xffffff;

        this.initLineDrawing();

        // Graphics
        this.lineGraphics = new PIXI.Graphics();
        this.tempLineGraphics = new PIXI.Graphics();
        this.polygonGraphics = new PIXI.Graphics();

        this.clearDrawing();
    }


    /**
     * @returns {PIXI.Graphics[]}
     */
    get graphics() {
        return [this.lineGraphics, this.tempLineGraphics, this.polygonGraphics];
    }


    /**
     * @returns {GraphicsManager}
     */
    initLineDrawing() {
        // Indicates that drawing is in progress
        this.drawingStarted = false;

        // Points
        this.fromPoint = new PIXI.Point(0, 0);
        this.currPoint = new PIXI.Point(0, 0);
        this.points = [];

        return this;
    }


    /**
     * @returns {GraphicsManager}
     */
    clearDrawing() {
        this.graphics.forEach((graphic) => {
            graphic.clear();
            graphic.lineStyle(this.LINE_WIDTH, this.LINE_COLOR);
        });

        return this;
    }


    /**
     * Starts drawing of a new polygon
     * @param {PIXI.Point} pointFrom
     */
    startLineDrawing(pointFrom) {
        this.fromPoint = pointFrom.clone();
        this.currPoint = pointFrom.clone();
        this.points.push(pointFrom.clone());
        this.drawingStarted = true;
    }


    /**
     * Finishes drawing and returns drawn polygon
     * @returns {Polygon}
     */
    endLineDrawing() {
        const polygon = new Polygon(this.points);
        this.initLineDrawing();

        return polygon;
    }


    /**
     * Draws a permanent line between last point and a given point
     * @param {PIXI.Point} pointTo
     */
    drawLine(pointTo) {
        const endPoint = this.checkPolygonEndPoint(pointTo);

        this.lineGraphics.moveTo(this.currPoint.x, this.currPoint.y);
        this.lineGraphics.lineTo(endPoint.x, endPoint.y);

        this.points.push(endPoint.clone());
        this.currPoint = endPoint.clone();
    }


    /**
     * Draws a line from the last point to a given point
     * Used for drawing line between last point and current mouse position (graphics gets cleared everytime)
     * @param {PIXI.Point} pointTo
     */
    drawTemporaryLine(pointTo) {
        const endPoint = this.checkPolygonEndPoint(pointTo);

        this.tempLineGraphics.clear();
        this.tempLineGraphics.lineStyle(this.LINE_WIDTH, this.LINE_COLOR);

        this.tempLineGraphics.moveTo(this.currPoint.x, this.currPoint.y);
        this.tempLineGraphics.lineTo(endPoint.x, endPoint.y);
    }


    /**
     * Checks if given point is in threshold area of starting point
     * @param {PIXI.Point} pointTo
     */
    checkPolygonEndThreshold(pointTo) {
        return Math.abs(pointTo.x - this.fromPoint.x) <= this.POLYGON_END_THRESHOLD
            && Math.abs(pointTo.y - this.fromPoint.y) <= this.POLYGON_END_THRESHOLD;
    }


    /**
     * Returns the starting point if pointTo is in threshold to be the ending point, else returns pointTo
     * @param {PIXI.Point} pointTo
     */
    checkPolygonEndPoint(pointTo) {
        return this.checkPolygonEndThreshold(pointTo)
            ? this.fromPoint
            : pointTo;
    }


    /**
     * @param {Polygon} polygon
     */
    drawPolygon(polygon) {
        this.polygonGraphics.drawPolygon(polygon);
    }


    /**
     * TODO: Triangulate polygon and then draw lines inside the polygon representing the triangulation
     * @param {Polygon} polygon
     */
    drawTriangulation(polygon) {
        polygon.triangulate()
    }
}