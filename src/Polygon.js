import * as PIXI from 'pixi.js';
import List from 'collections/list';
import Utils from './Utils';


/**
 * Class extending default polygon to provide supporting methods
 */
export default class Polygon extends PIXI.Polygon {
    /**
     * @param {Point[]} points
     */
    constructor(...points) {
        super(...points);
        this.allPoints = new List(...points);
    }


    /**
     * @returns {Polygon}
     */
    clone() {
        return new Polygon(this.allPoints.toArray());
    }


    /**
     * Iterates over all polygon point nodes and fills all lists with appropriate points
     * @returns {Polygon}
     */
    initEarClipping() {
        this.reflexPoints = new List();
        this.convexPoints = new List();
        this.earPoints = new List();

        this.iteratePointNodes((currNode) => this.testNodeForEar(currNode));

        this.reflexPoints.reverse();
        this.convexPoints.reverse();
        this.earPoints.reverse();

        return this;
    }


    /**
     * Check if point is convex or reflex and whether it's an ear and prepend it to appropriate lists
     * @param node
     * @returns {Polygon}
     */
    testNodeForEar(node) {
        const [prevPoint, nextPoint] = Utils.getPreviousAndNextPoint(node);
        const currPoint = node.value;

        if (currPoint.isConvex(prevPoint, nextPoint, this)) {
            this.reflexPoints.delete(currPoint);

            if (this.convexPoints.get(currPoint) == null) {
                this.convexPoints.unshift(currPoint);
            }

            if (currPoint.isEar(prevPoint, nextPoint, this) && this.earPoints.get(currPoint) == null) {
                this.earPoints.unshift(currPoint);
            } else if (!currPoint.isEar(prevPoint, nextPoint, this)) {
                this.earPoints.delete(currPoint);
            }
        } else {
            if (this.reflexPoints.get(currPoint) == null) {
                this.reflexPoints.unshift(currPoint);
            }

            this.convexPoints.delete(currPoint);
            this.earPoints.delete(currPoint);
        }

        return this;
    }


    /**
     * Apply given function to all nodes of a given point list
     * @param func
     * @param points
     * @returns {Polygon}
     */
    iteratePointNodes(func, points = this.allPoints) {
        let currNode = points.head.next;

        while (currNode.value != null) {
            func(currNode);
            currNode = currNode.next;
        }

        return this;
    }


    /**
     * Find node which contains given point
     * @param {Point} point
     * @returns {*}
     */
    getNodeFromPoint(point) {
        let node;

        this.iteratePointNodes((currNode) => {
            if (currNode.value.equals(point)) {
                node = currNode;
            }
        });

        return node;
    }


    // TODO: Implement algorithm to detect if polygon is simple
    isSimple() {
        return true;
    }
}