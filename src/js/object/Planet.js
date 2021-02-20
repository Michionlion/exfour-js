import Phaser from "phaser";
import GameScene from "../scene/GameScene";
import Ship from "./Ship";
import { clamp } from "../util";

const PLANET_IMAGE = "planet";

/**
 * How far each orbital shell is from the last
 * @type {Number}
 */
const ORBITAL_SHELL_INCREMENT = 7;

/**
 * How much orbital circumference does one ship need, in pixels?
 * @type {Number}
 */
const ORBITAL_SPACE_PER_SHIP = 5;

export default class Planet {
  /**
   *
   * @param {String} name the name of this planet
   * @param {Phaser.GameObjects.Image} visual the displayed visual of this planet
   * @param {Phaser.GameObjects.Text} label the displayed label of this planet
   * @param {Number} orbitalRadius radius from center of obj to start orbits at
   * @param {Array<Ship>} [ships=[]] the ships to put in orbit
   */
  constructor(name, visual, label, orbitalRadius, ships = []) {
    this.name = name;
    this.visual = visual;
    this.label = label;
    this.orbitalRadius = orbitalRadius;

    this.visual.setInteractive();
    this.visual.setData("planet", this);
    this.visual.on("pointerover", () => this.label.setVisible(true));
    this.visual.on("pointerout", () => this.label.setVisible(false));

    /**
     * @type {Array<Array<Ship>>} orbital shell => ships in shell
     */
    this.orbitals = [];

    /**
     * @type {Array<Number>} orbital shell => max ship count
     */
    this.maxShips = [];

    /**
     * @type {Number} number of ships in orbitals
     */
    this.shipCount = 0;

    /**
     * @type {Number} total number of ship orbital slots available
     */
    this.shipCapacity = this.getShipCapacity();

    ships.forEach((ship) => this.requestOrbit(ship));
  }

  /**
   *
   * @param {GameScene} scene the scene to add a new planet to
   * @param {Number} x the initial x position
   * @param {Number} y the initial y position
   * @param {Number} radius the radius of the planet
   * @param {String} name the name of the planet
   * @returns {Planet} the added planet
   */
  static add(scene, x, y, radius, name = "planet") {
    let image = scene.add
      .image(x, y, PLANET_IMAGE)
      .setDepth(-1)
      .setOrigin(0.5, 0.5)
      .setDisplaySize(radius * 2, radius * 2);
    let label = scene.add
      .text(x, y, name)
      .setOrigin(0.5, 0.5)
      .setAlign("center")
      .setColor("white")
      .setVisible(false);

    return new Planet(name, image, label, radius + 2);
  }

  remove() {
    this.visual.off("pointerover").off("pointerout").off("pointerdown");
    this.visual.destroy();
    this.label.destroy();
  }

  getOrbitRadius(shell) {
    return this.orbitalRadius + shell * ORBITAL_SHELL_INCREMENT;
  }

  getMaxShips(shell) {
    let radius = this.getOrbitRadius(shell);
    if (radius > this.orbitalRadius * 2.5) {
      return 0;
    } else if (!this.maxShips[shell]) {
      this.maxShips[shell] = Math.floor(
        (radius * 2 * Math.PI) / ORBITAL_SPACE_PER_SHIP
      );
    }
    return this.maxShips[shell];
  }

  getShipCapacity() {
    if (!this.shipCapacity) {
      let total = 0;
      for (let shell = 0; this.getMaxShips(shell) > 0; shell++) {
        total += this.getMaxShips(shell);
      }
      this.shipCapacity = total;
    }
    return this.shipCapacity;
  }

  getShipCount() {
    return this.shipCount;
  }

  getShellOrbits(shell) {
    if (!this.orbitals[shell]) {
      this.orbitals[shell] = [];
      console.log(`made new orbital ${shell}`);
    }
    return this.orbitals[shell];
  }

  getCompactOrbitals() {
    return this.orbitals.map((shell) =>
      shell.filter((ship) => ship instanceof Ship)
    );
  }

  /**
   *
   * @param {Ship} ship the ship to search for
   * @returns {{shell: Number, orbit: Number}} location of ship or null if not found
   */
  getShipLocation(ship) {
    let shell = this.orbitals.length - 1;
    let orbit = this.getMaxShips(shell) - 1;
    while (this.getShellOrbits(shell)[orbit] !== ship) {
      if (orbit > 0) {
        orbit--;
      } else if (shell > 0) {
        shell--;
        orbit = this.getMaxShips(shell);
      } else {
        shell = -1;
        break;
      }
    }
    if (shell >= 0) {
      return { shell, orbit };
    } else {
      return null;
    }
  }

  /**
   *
   * @param {Ship} ship the ship requesting orbital parameters
   * @returns {{shell: Number, orbit: Number}} location of new ship orbit or null if denied orbit
   */
  requestOrbit(ship) {
    // determine innermost orbital slot
    let shell = 0;
    let orbit = 0;
    while (this.getShellOrbits(shell)[orbit] instanceof Ship) {
      if (orbit < this.getMaxShips(shell) - 1) {
        orbit++;
      } else if (this.getMaxShips(shell + 1) > 0) {
        shell++;
        orbit = 0;
      } else {
        shell = -1;
        break;
      }
    }

    if (shell >= 0) {
      this.orbitals[shell][orbit] = ship;
      let angleAtZero = (orbit / this.getMaxShips(shell)) * 2 * Math.PI;
      let orbitRadius = this.getOrbitRadius(shell);
      let radian = (time) =>
        angleAtZero -
        ((time / Math.pow(orbitRadius * 0.67, 2)) % (Math.PI * 2));

      this.shipCount++;
      ship.onOrbit(this, orbitRadius, radian);
      return { shell, orbit };
    } else {
      return null;
    }
  }

  /**
   *
   * @param {Ship | Number} shipShell the Ship to remove, or the shell index
   * @param {Number} [orbit=NaN] the orbit index
   */
  leaveOrbit(shipShell, orbit = NaN) {
    let location;
    if (shipShell instanceof Ship) location = this.getShipLocation(shipShell);
    else location = { shell: shipShell, orbit };
    if (location) {
      let ship = this.orbitals[location.shell][location.orbit];
      if (ship) {
        ship.onLeaveOrbit(this);
        delete this.orbitals[location.shell][location.orbit];
        this.shipCount--;
        return true;
      }
    }
    return false;
  }

  /**
   *
   * @param {Planet} planet the planet to attack
   */
  attack(planet) {
    if (planet === this) return false; // throw Error("Cannot attack self");

    let numShipsToSend = clamp(
      this.shipCount / 2,
      0,
      planet.getShipCapacity() - planet.getShipCount()
    );

    let ships = [];
    let shell = this.orbitals.length - 1;
    let orbit = this.getMaxShips(shell) - 1;
    while (ships.length < numShipsToSend) {
      let ship = this.orbitals[shell][orbit];
      if (this.leaveOrbit(shell, orbit)) {
        ships.push(ship);
      }
      if (orbit > 0) {
        orbit--;
      } else if (shell > 0) {
        shell--;
        orbit = this.getMaxShips(shell);
      } else {
        break;
      }
    }

    // there are ships to send
    if (ships.length > 0) {
      ships.forEach((ship) => ship.onAttack(planet));
      return ships;
    } else {
      return false;
    }
  }

  update(time, delta) {
    // TODO: this is for debugging only
    /** @type {Phaser.Input.Pointer} */
    let mouse = globalThis.GAME.input.mousePointer;
    if (
      mouse.rightButtonDown() &&
      Phaser.Math.Distance.BetweenPointsSquared(this.visual, {
        x: mouse.worldX,
        y: mouse.worldY
      }) < this.orbitalRadius*this.orbitalRadius
    ) {
      for (let i = 25; i--; ) {
        let ship = globalThis.GAME.makeShip();
        if (this.requestOrbit(ship)) {
          ship.handleOrbit(time);
        } else {
          ship.remove();
        }
      }
    }
  }
}
