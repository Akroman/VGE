import * as PIXI from 'pixi.js';
import Polygon from './Polygon';
import Point from './Point';
import Triangulator from "./Triangulator";


/**
 * Class for creating and drawing lines and polygons
 */
export default class GraphicsManager {
    constructor() {
        // Constants
        this.POLYGON_END_THRESHOLD = 10;
        this.LINE_WIDTH = 1.5;
        this.LINE_COLOR = 0xffffff;
        this.TRIANGULATION_COLOR = 0xff0000;

        this.initLineDrawing();
        this.triangulator = new Triangulator(new Polygon());

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
        this.drawingStarted = false;

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
        this.graphics.forEach((graphic) => {
            graphic.clear();
            graphic.lineStyle(this.LINE_WIDTH, this.LINE_COLOR);
        });
        this.triangulationGraphics.lineStyle(this.LINE_WIDTH, this.TRIANGULATION_COLOR);

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
        this.drawingStarted = true;
    }


    /**
     * Finishes drawing, draws the polygon and sets drawn polygon to the triangulator
     * @returns {Polygon}
     */
    endLineDrawing() {
        const polygon = new Polygon(this.points.slice(0, this.points.length - 1));
        this.clearDrawing().polygonGraphics.drawPolygon(polygon);
        this.triangulator.setPolygon(polygon);
        this.initLineDrawing();
    }


    /**
     * Draws a permanent line between last point and a given point
     * @param {Point} pointTo
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
     * @param {Point} pointTo
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
     * @param {Point} pointTo
     */
    checkPolygonEndThreshold(pointTo) {
        return Math.abs(pointTo.x - this.fromPoint.x) <= this.POLYGON_END_THRESHOLD
            && Math.abs(pointTo.y - this.fromPoint.y) <= this.POLYGON_END_THRESHOLD;
    }


    /**
     * Returns the starting point if pointTo is in threshold to be the ending point, else returns pointTo
     * @param {Point} pointTo
     */
    checkPolygonEndPoint(pointTo) {
        return this.checkPolygonEndThreshold(pointTo) ? this.fromPoint : pointTo;
    }


    /**
     * Run triangulation algorithm and then draw lines splitting the polygon into triangles
     */
    drawTriangulation() {
        this.triangulator.earClipping();

        this.triangulationGraphics.clear();
        this.triangulationGraphics.lineStyle(this.LINE_WIDTH, this.TRIANGULATION_COLOR);

        this.triangulator.lines.forEach((line) => {
            this.triangulationGraphics.moveTo(line.from.x, line.from.y);
            this.triangulationGraphics.lineTo(line.to.x, line.to.y);
        });
    }
}