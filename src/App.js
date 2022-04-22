import * as PIXI from 'pixi.js';
import * as dat from 'dat.gui';
import GraphicsManager from "./GraphicsManager";
import Polygon from "./Polygon";


/**
 * Main class of the whole program, handles interaction and drawing with help of other classes
 */
export default class App {
    constructor() {
        this.pixiApp = new PIXI.Application({resizeTo: window});
        document.body.appendChild(this.pixiApp.view);

        this.graphicsManager = new GraphicsManager();
        this.pixiApp.stage.addChild(...this.graphicsManager.graphics);

        this.interactManager = new PIXI.InteractionManager(this.pixiApp.renderer);
        this.gui = new dat.GUI();

        this.polygon = new Polygon();
    }


    /**
     * Add all event handlers to interaction manager
     * @returns {App}
     */
    initInteraction() {
        this.interactManager.on('pointerdown', (event) => {
            const pointTo = event.data.global;
            if (!this.graphicsManager.drawingStarted) {
                this.graphicsManager.startLineDrawing(pointTo);
            } else {
                this.graphicsManager.drawLine(pointTo);
                if (this.graphicsManager.checkPolygonEndThreshold(pointTo)) {
                    this.polygon = this.graphicsManager.endLineDrawing();
                    this.graphicsManager.clearDrawing().drawPolygon(this.polygon);
                }
            }
        });

        this.interactManager.on('pointermove', (event) => {
            if (this.graphicsManager.drawingStarted) {
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
        const polygonObj = {
            Delete: () => {
                this.graphicsManager.clearDrawing().initLineDrawing();
            },
            Triangulate: () => {
                this.graphicsManager.drawTriangulation(this.polygon);
            }
        };

        const polygonFolder = this.gui.addFolder('Polygon');
        polygonFolder.add(polygonObj, 'Delete');
        polygonFolder.add(polygonObj, 'Triangulate');
        polygonFolder.open();

        return this;
    }
}