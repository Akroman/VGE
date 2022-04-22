import * as PIXI from 'pixi.js';


/**
 * @extends {PIXI.Polygon}
 */
export default class Polygon extends PIXI.Polygon {
    // TODO: Implement algorithm to detect if polygon is convex
    isConvex() {
        return true;
    }


    // TODO: Implement triangulation algorithm
    triangulate() {

    }
}