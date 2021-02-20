import Phaser from "phaser";
import { clamp, mapRange } from "../util";

export const MAX_ZOOM = 8;
export const MIN_ZOOM = 0.04;

function zoomClamp(value) {
  return clamp(value, MIN_ZOOM, MAX_ZOOM);
}

export default class ZoomManager {
  constructor(zoom = 1, stiffness = 0.3, camera = null) {
    this.setZoomTarget(zoom);
    this.setStiffness(stiffness);
    this.setCamera(camera);

    /**
     * @type {Array<(zoom: Number) => ?>}
     */
    this.zoomListeners = [];
  }

  /**
   *
   * @param {Phaser.Cameras.Scene2D.Camera} camera
   */
  setCamera(camera) {
    this.camera = camera;
    if (camera) {
      this.camera.zoom = this.targetZoomLevel;
    }
  }

  setZoomTarget(zoom) {
    this.targetZoomLevel = zoomClamp(zoom);
  }

  zoom(amount) {
    if (amount != 0) {
      this.setZoomTarget(this.targetZoomLevel * (1 - amount));
    }
  }

  setStiffness(stiffness) {
    if (stiffness > 0 && stiffness <= 1) {
      this.stiffness = stiffness;
    } else {
      throw new Error("stiffness must be in (0, 1]");
    }
  }

  /**
   *
   * @param {Function(Number)} listener
   */
  registerZoomListener(listener) {
    this.zoomListeners.push(listener);
    if (this.camera) listener(this.camera.zoom);
  }

  unregisterZoomListener(listener) {
    this.zoomListeners.remove(listener);
  }

  handleZoom() {
    if (this.camera) {
      let diff = this.targetZoomLevel - this.camera.zoom;
      if (diff != 0) {
        // enable difference stiffness based on zoom direction
        if (diff > MIN_ZOOM / 2) {
          this.camera.zoom = zoomClamp(
            this.camera.zoom + diff * this.stiffness // * 0.67
          );
          // console.log(`set zoom to ${this.camera.zoom}`);
        } else if (diff < -MIN_ZOOM / 2) {
          this.camera.zoom = zoomClamp(
            this.camera.zoom + diff * this.stiffness
          );
        } else if (diff != 0) {
          this.camera.zoom = this.targetZoomLevel;
          // console.log(`set zoom to ${this.camera.zoom} (${diff})`);
        }
        this.zoomListeners.forEach((listener) => listener(this.camera.zoom));
      }
    }
  }
}
