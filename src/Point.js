import * as PIXI from 'pixi.js';
import Utils from './Utils';
import Polygon from './Polygon';


/**
 * Class extending default point to provide supporting methods
 */
export default class Point extends PIXI.Point {
    /**
     * @returns {Point}
     */
    clone() {
        return new Point(this.x, this.y);
    }


    /**
     * Add point to this point (returns new point)
     * @param {Point} point
     * @returns {Point}
     */
    add(point) {
        return new Point(this.x + point.x, this.y + point.y);
    }


    /**
     * Subtract point from this point (returns new point)
     * @param {Point} point
     * @returns {Point}
     */
    sub(point) {
        return new Point(this.x - point.x, this.y - point.y);
    }


    /**
     * Multiply this point by a scalar (returns new point)
     * @param {number} number
     * @returns {Point}
     */
    multiplyScalar(number) {
        return new Point(this.x * number, this.y * number);
    }


    /**
     * Normalize this point (returns a new point)
     * @returns {Point}
     */
    normalize() {
        const magnitude = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
        return new Point(this.x / magnitude, this.y / magnitude);
    }


    /**
     * Calculate distance to a point
     * @param {Point} point
     * @returns {number}
     */
    distanceTo(point) {
        return Math.sqrt(Math.pow(this.x - point.x, 2) + Math.pow(this.y - point.y, 2));
    }


    /**
     * Calculate direction to given point
     * @param {Point} point
     * @returns {Point}
     */
    directionTo(point) {
        return point.sub(this).normalize();
    }


    /**
     * Find point in direction specified by point and in given distance
     * @param {Point} point
     * @param {number} distance
     * @returns {Point}
     */
    getPointInDirection(point, distance) {
        return this.add(this.directionTo(point).multiplyScalar(distance));
    }


    /**
     * Get point lying in the middle between this point and given point
     * @param {Point} point
     * @returns {Point}
     */
    getMiddlePoint(point) {
        return new Point((this.x + point.x) / 2, (this.y + point.y) / 2);
    }


    /**
     * Check if given point lies in threshold of this point
     * @param {Point} point
     * @param {number} threshold
     * @returns {boolean}
     */
    isPointInThreshold(point, threshold) {
        return Math.abs(point.x - this.x) <= threshold && Math.abs(point.y - this.y) <= threshold;
    }


    /**
     * Calculate angle between two points from cosine law
     * @param {Point} firstPoint
     * @param {Point} secondPoint
     * @returns {number}
     */
    getAngle(firstPoint, secondPoint) {
        const distanceThisFirst = this.distanceTo(firstPoint);
        const distanceThisSecond = this.distanceTo(secondPoint);
        const distanceFirstSecond = firstPoint.distanceTo(secondPoint);

        return Utils.radiansToDegrees(Math.acos(
            (Math.pow(distanceThisFirst, 2) + Math.pow(distanceThisSecond, 2) - Math.pow(distanceFirstSecond, 2))
            / (2 * distanceThisFirst * distanceThisSecond)
        ));
    }


    /**
     * Check whether this point of a given polygon is convex or reflex
     * @param {Point} prevPoint
     * @param {Point} nextPoint
     * @param {Polygon} polygon
     * @returns {boolean}
     */
    isConvex(prevPoint, nextPoint, polygon) {
        const middlePoint = prevPoint.getMiddlePoint(nextPoint);
        const checkPoint = this.getPointInDirection(middlePoint, 1);
        let angle = this.getAngle(prevPoint, nextPoint);
        angle = polygon.contains(checkPoint.x, checkPoint.y) ? angle : 360 - angle;

        return angle < 180;
    }


    /**
     * Check whether this point of a given polygon is ear
     * @param {Point} prevPoint
     * @param {Point} nextPoint
     * @param {Polygon} polygon
     * @returns {boolean}
     */
    isEar(prevPoint, nextPoint, polygon) {
        const triangle = new Polygon([this, prevPoint, nextPoint]);
        let isEar = true;

        polygon.iteratePointNodes((currNode) => {
            const currPoint = currNode.value;
            if (
                triangle.contains(currPoint.x, currPoint.y)
                && !currPoint.equals(this) && !currPoint.equals(prevPoint) && !currPoint.equals(nextPoint)
            ) {
                isEar = false;
            }
        });

        return isEar;
    }
}