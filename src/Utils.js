import Point from './Point';


/**
 * Class with various helper methods
 */
export default class Utils {
    /**
     * Convert radians to degrees
     * @param {number} radians
     * @returns {number}
     */
    static radiansToDegrees(radians) {
        return radians * (180 / Math.PI);
    }


    /**
     * Find middle point between two points
     * @param {Point} firstPoint
     * @param {Point} secondPoint
     * @returns {Point}
     */
    static getMiddlePoint(firstPoint, secondPoint) {
        return new Point((firstPoint.x + secondPoint.x) / 2, (firstPoint.y + secondPoint.y) / 2);
    }


    /**
     * Get pair of previous point and next point of a polygon node
     * @param node
     * @returns {*[]}
     */
    static getPreviousAndNextPoint(node) {
        let prevPoint, nextPoint;
        if (node.prev.value == null) {
            prevPoint = node.prev.prev.value;
            nextPoint = node.next.value;
        } else if (node.next.value == null) {
            prevPoint = node.prev.value;
            nextPoint = node.next.next.value;
        } else {
            prevPoint = node.prev.value;
            nextPoint = node.next.value;
        }

        return [prevPoint, nextPoint];
    }
}