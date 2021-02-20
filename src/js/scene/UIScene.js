import Phaser from "phaser";
import GameScene from "./GameScene";
import { MIN_ZOOM, MAX_ZOOM } from "../manager/ZoomManager";
import Planet from "../object/Planet";
import Ship from "../object/Ship";
import { clamp, mapRange } from "../util";

const linearize = (x) => Math.pow(x, 1 / (4 * Math.E));
const exponentiate = (x) => Math.pow(x, 4 * Math.E);

const DELTA_TIME_ELEMENT = document.getElementById("delta");

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "ui" });
    this.bar = null;
    this.pip = null;
    this.pipRange = 0;
    this.dragging = false;
  }

  create() {
    /**
     * @type {GameScene}
     */
    this.game = this.scene.get("game");
    let width = this.cameras.main.width;
    let height = this.cameras.main.height;

    this.bar = this.add
      .rectangle(width - 20, 0, 20, height, 0xbbbbbb, 0.33)
      .setAlpha(0.25)
      .setOrigin(0, 0)
      .setInteractive();
    this.pipRange = height - 40;
    this.pip = this.add
      .rectangle(width - 18, 2, 16, 36, 0xffffff, 0.83)
      .setAlpha(0.67)
      .setOrigin(0, 0)
      .setInteractive();

    console.log(this.pip);
    this.input.setDraggable(this.pip);

    this.cameras.main.transparent = true;
    this.scene.moveAbove("game");
    console.log("created UI");
    this.game.zoomManager.registerZoomListener(this.handleZoom.bind(this));

    this.pip.on("pointerover", () => this.highlightPip(true));
    this.pip.on("pointerout", () => this.highlightPip(false));
    this.pip.on("dragstart", () => (this.dragging = true));
    this.pip.on("dragend", () => (this.dragging = false));
    this.bar.on("pointerover", () => this.highlightBar(true));
    this.bar.on("pointerout", () => this.highlightBar(false));

    this.pip.on("drag", (pointer) => this.handleDrag(pointer.y - 18));
    this.bar.on("pointerdown", (pointer) => this.handleDrag(pointer.y - 18));
  }

  highlightBar(active) {
    this.bar.alpha = active ? 0.67 : 0.33;
  }

  highlightPip(active) {
    this.pip.alpha = active ? 1 : 0.67;
    this.highlightBar(active);
  }

  zoomToPip(zoom) {
    return mapRange(
      linearize(zoom),
      [linearize(MIN_ZOOM), linearize(MAX_ZOOM)],
      [this.pipRange, 0]
    );
  }

  pipToZoom(pip) {
    return exponentiate(
      mapRange(
        pip,
        [this.pipRange, 0],
        [linearize(MIN_ZOOM), linearize(MAX_ZOOM)]
      )
    );
  }

  setPip(height) {
    height = clamp(height, 0, this.pipRange);
    this.pip.y = 2 + height;
    return height;
  }

  handleZoom(zoom) {
    if (this.dragging) return;
    this.setPip(this.zoomToPip(zoom));
  }

  handleDrag(drag) {
    let set = this.setPip(drag - 2);
    set = this.pipToZoom(set);
    this.game.zoomManager.setZoomTarget(set);
  }

  update(time, delta) {
    DELTA_TIME_ELEMENT.innerText = `${(1000 / delta).toPrecision(
      2
    )} fps - ${delta.toPrecision(2)} ms`;
  }
}
