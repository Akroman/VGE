import Polygon from './Polygon';


/**
 * Class representing a triangle in triangulation
 */
export default class Triangle extends Polygon {
    /**
     * @param {Point} from
     * @param {Point} ear
     * @param {Point} to
     */
    constructor(from, ear, to) {
        super([from, ear, to]);

        this.from = from;
        this.ear = ear;
        this.to = to;
    }
}