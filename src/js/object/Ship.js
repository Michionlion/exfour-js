import Phaser from "phaser";
import GameScene from "../scene/GameScene";
import Planet from "./Planet";
import { MIN_ZOOM } from "../manager/ZoomManager";
import { mapRange } from "../util";

export default class Ship {
  /**
   *
   * @param {Phaser.GameObjects.Components.Transform} visual the displayed visual of this ship
   * @param {Number} vx velocity on the x axis
   * @param {Number} vy velocity on the y axis
   */
  constructor(visual, vx = 0, vy = 0) {
    this.visual = visual;
    this.vx = vx;
    this.vy = vy;

    this.visual.setData("ship", this);

    /**
     * @type {Planet}
     */
    this.orbiting = null;

    /**
     * @type {Planet}
     */
    this.attacking = null;

    /**
     * @type {Number} the squared distance left to travel to the attacked planet
     */
    this.attackTransitDistance = -1;

    /**
     * @type {Number} the transit speed (in pixels per second)
     */
    this.transitSpeed = 100;

    /**
     * @type {Number}
     */
    this.orbitalRadius = null;

    /**
     * @type {(time: Number) => Number}
     */
    this.getOrbitalRadian = null;
  }

  /**
   * Create and add a ship to the given scene
   * @param {GameScene} scene the scene to add a new ship to
   * @param {Number} x the initial x position
   * @param {Number} y the initial y position
   * @returns {Ship} the added ship
   */
  static add(scene, x = 0, y = 0) {
    // let image = scene
    //   .image(x, y, SHIP_IMAGE)
    //   .setOrigin(0.5, 0.5)
    //   .setDisplaySize(32, 16);
    let image = scene.add
      .triangle(x, y, 0, 0, 2, 0.7, 0, 1.4, 0xaaa9ad, 1)
      .setOrigin(0.334, 0.5);
    let ship = new Ship(image);

    scene.zoomManager.registerZoomListener(ship.handleZoom.bind(ship));

    return ship;
  }

  remove() {
    if (this.orbiting) {
      this.orbiting.leaveOrbit(this);
    }
    this.visual.destroy();
  }

  getCurrentOrbitalPosition(time) {
    if (this.orbiting) {
      let radian = this.getOrbitalRadian(time);
      return {
        x: this.orbiting.visual.x + this.orbitalRadius * Math.sin(radian),
        y: this.orbiting.visual.y + this.orbitalRadius * -Math.cos(radian),
        r: radian - Math.PI,
      };
    } else {
      return null;
    }
  }

  handleZoom(zoom) {
    // this.visual.scale = Math.pow(1 / zoom, -MIN_ZOOM);
  }

  handleOrbit(time) {
    let params = this.getCurrentOrbitalPosition(time);
    if (params) {
      this.visual.x = params.x;
      this.visual.y = params.y;
      this.visual.setRotation(params.r);
      return true;
    }
    return false;
  }

  handleAttack(time, delta) {
    // put delta into seconds
    // delta /= 1000;
    if (this.attacking) {
      this.attackTransitDistance = Phaser.Math.Distance.BetweenPoints(
        this.visual,
        this.attacking.visual
      );
      let targetX, targetY;
      if (this.attackTransitDistance < this.attacking.orbitalRadius * 3) {
        // aim towards orbital position
        let target = this.getCurrentOrbitalPosition(time);
        this.attackTransitDistance = Phaser.Math.Distance.BetweenPoints(
          this.visual,
          target
        );
        if (this.attackTransitDistance < 3) {
          this.attacking = null;
          this.visual.x = target.x;
          this.visual.y = target.y;
          this.visual.rotation = target.r;
          return false;
        } else {
          targetX = target.x;
          targetY = target.y;
        }
      } else {
        // aim towards planet center
        targetX = this.attacking.visual.x;
        targetY = this.attacking.visual.y;
      }

      let percentThisFrame = mapRange(
        this.transitSpeed * delta,
        [0, this.attackTransitDistance],
        [0, 1]
      );

      this.visual.x = Phaser.Math.Linear(
        this.visual.x,
        targetX,
        percentThisFrame
      );
      this.visual.y = Phaser.Math.Linear(
        this.visual.y,
        targetY,
        percentThisFrame
      );
      this.visual.angle = Phaser.Math.Angle.Between(
        this.visual.x,
        this.visual.y,
        targetX,
        targetY
      );
      return true;
    }
    return false;
  }

  update(time, delta) {
    if (!this.handleAttack(time, delta) && !this.handleOrbit(time)) {
      // this.visual.x += this.vx * delta;
      // this.visual.y += this.vy * delta;
      this.visual.angle += 180 * delta;
    }
  }

  /**
   *
   * @param {Planet} planet the planet where this ship is now in orbit
   * @param {Number} orbitalRadius the distance from the planet this ship should orbit
   * @param {(time: Number) => Number} getTargetRadian a function to return the target radian at any given time
   */
  onOrbit(planet, orbitalRadius, getTargetRadian) {
    this.vx = 0;
    this.vy = 0;
    this.orbiting = planet;
    this.orbitalRadius = orbitalRadius;
    this.getOrbitalRadian = getTargetRadian;
    console.log(`Entered orbit of ${planet.name}`);
  }

  /**
   * @param {Planet} planet the planet this ship left
   */
  onLeaveOrbit(planet) {
    this.orbiting = null;
    this.orbitalRadius = NaN;
    this.getOrbitalRadian = null;
    console.log(`Left orbit of ${planet.name}`);
  }

  /**
   * @param {Planet} planet the planet this ship should attack
   */
  onAttack(planet) {
    if (planet.requestOrbit(this)) {
      this.attacking = planet;
      // onOrbit should have been called by now
      this.attackTransitDistance = Phaser.Math.Distance.BetweenPointsSquared(
        this.visual,
        planet.visual
      );
    } else {
      throw new Error(
        `sent to attack ${planet.name} but failed to receive orbit`
      );
    }
  }
}
