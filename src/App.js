import * as PIXI from 'pixi.js';
import * as dat from 'dat.gui';
import GraphicsManager from './GraphicsManager';
import Polygon from './Polygon';
import Point from './Point';


/**
 * Main class of the whole program, handles interaction and drawing with help of other classes
 */
export default class App {
    constructor() {
        this.pixiApp = new PIXI.Application({
            resizeTo: window,
            backgroundColor: 0x000000
        });
        document.body.appendChild(this.pixiApp.view);

        this.graphicsManager = new GraphicsManager();
        this.pixiApp.stage.addChild(...this.graphicsManager.graphics);

        this.interactManager = new PIXI.InteractionManager(this.pixiApp.renderer);
        this.gui = new dat.GUI();
    }


    /**
     * Add all event handlers to interaction manager
     * @returns {App}
     */
    initInteraction() {
        this.interactManager.on('pointerdown', (event) => {
            const pointTo = new Point(event.data.global.x, event.data.global.y);
            if (!this.graphicsManager.lineDrawingStarted) {
                this.graphicsManager.startLineDrawing(pointTo);
            } else {
                this.graphicsManager.drawLine(pointTo);
                if (this.graphicsManager.checkPolygonEndThreshold(pointTo)) {
                    this.graphicsManager.endLineDrawing();
                }
            }
        });

        this.interactManager.on('pointermove', (event) => {
            if (this.graphicsManager.lineDrawingStarted) {
                this.graphicsManager.drawTemporaryLine(event.data.global);
            }
        });

        return this;
    }


    /**
     * Add all folders and objects to the GUI
     * @returns {App}
     */
    initGui() {
        this.polygonObj = {
            Delete: () => {
                this.graphicsManager.clearDrawing().initLineDrawing().initTriangulation();
            },
            TriangulateEars: () => {
                this.graphicsManager.triangulate();
            },
            TriangulateConvex: () => {
                this.graphicsManager.triangulateConvex();
            },
            TriangulateMonotone: () => {
                this.graphicsManager.triangulateMonotone()
            },
            Speed: 1
        };

        const polygonFolder = this.gui.addFolder('Polygon');
        const triangulationFolder = polygonFolder.addFolder('Triangulation');

        polygonFolder.add(this.polygonObj, 'Delete');

        triangulationFolder.add(this.polygonObj, 'TriangulateEars');
        triangulationFolder.add(this.polygonObj, 'TriangulateConvex');
        triangulationFolder.add(this.polygonObj, 'TriangulateMonotone');
        triangulationFolder.add(this.polygonObj, 'Speed', 0, 5);


        polygonFolder.open();
        triangulationFolder.open();

        return this;
    }


    /**
     * Add handler to ticker for animating triangulation
     */
    run() {
        this.pixiApp.ticker.add((delta) => {
            if (this.graphicsManager.triangulationInProgress) {
                this.graphicsManager.animateTriangulation(delta, this.polygonObj.Speed);
            }
        });

        return this;
    }
}