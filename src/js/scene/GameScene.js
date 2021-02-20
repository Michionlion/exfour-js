import Phaser from "phaser";
import ZoomManager from "../manager/ZoomManager";
import Planet from "../object/Planet";
import Ship from "../object/Ship";
import { arrayRemove, mapRange } from "../util";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "game" });
    this.zoomManager = new ZoomManager(1, 0.34);
    globalThis.GAME = this;

    /**
     * @type {Array<Ship>}
     */
    this.ships = [];

    /**
     * @type {Phaser.GameObjects.Group}
     */
    this.shipGroup = null;

    /**
     * @type {Array<Planet>}
     */
    this.planets = [];

    /**
     * @type {Phaser.GameObjects.Group}
     */
    this.planetGroup = null;

    /**
     * @type {Planet}
     */
    this.selectedPlanet = null;

    /**
     * @type {Phaser.GameObjects.Container}
     */
    this.selectUI = null;
  }

  makeShip(x = 0, y = 0) {
    let ship = Ship.add(this, x, y);
    this.ships.push(ship);
    this.shipGroup.add(ship.visual);
    return ship;
  }

  makePlanet(x, y, radius, name) {
    let planet = Planet.add(this, x, y, radius, name);
    this.planets.push(planet);
    this.planetGroup.add(planet.visual);
    return planet;
  }

  makeSelectUI(x, y, radius) {
    return this.add.container(x, y, [
      this.add.circle(0, 0, radius * 0.94, 0xffffff, 0.175).setAlpha(0.1),
      this.add
        .container(0, 0, [
          this.add
            .line(radius, -radius, 0, 0, -0.2 * radius, 0.2 * radius)
            .setStrokeStyle(1, 0xffffff)
            .setLineWidth(0.33)
            .setOrigin(0, 0),
          this.add
            .line(radius, radius, 0, 0, -0.2 * radius, -0.2 * radius)
            .setStrokeStyle(1, 0xffffff)
            .setLineWidth(0.33)
            .setOrigin(0, 0),
          this.add
            .line(-radius, radius, 0, 0, 0.2 * radius, -0.2 * radius)
            .setStrokeStyle(1, 0xffffff)
            .setLineWidth(0.33)
            .setOrigin(0, 0),
          this.add
            .line(-radius, -radius, 0, 0, 0.2 * radius, 0.2 * radius)
            .setStrokeStyle(1, 0xffffff)
            .setLineWidth(0.33)
            .setOrigin(0, 0),
        ])
        .setName("lines"),
    ]);
  }

  create() {
    globalThis.GAME = this;
    this.cameras.main.centerOn(0, 0);
    this.zoomManager.setCamera(this.cameras.main);
    // TODO: do we want to use Phaser's events system?
    // this.zoomManager.registerZoomListener(zoom => this.events.emit("zoom", zoom));
    this.input.keyboard
      .on("keydown-R", () => this.scene.restart())
      .on("keydown-Q", () => this.scene.start("menu"));
    this.input.on("wheel", (pointer) =>
      this.zoomManager.zoom(pointer.deltaY / 1000)
    );

    // this.tweens.addCounter({
    //   from: 250,
    //   to: 200,
    //   ease: Phaser.Math.Easing.Sine.InOut,
    //   duration: 750,
    //   repeat: -1,
    //   yoyo: true,
    //   onUpdate: (tween) => {
    //     const value = Math.floor(tween.getValue());
    //     console.log(value);
    //     this.selectUI.strokeColor = Phaser.Display.Color.GetColor(240, 240, value);
    //     this.selectUI.lineWidth = (value - 180) / 42
    //   }
    // })

    this.shipGroup = this.add.group({
      name: "ships",
    });
    this.planetGroup = this.add.group({
      name: "planets",
    });

    let hugePlanet = this.makePlanet(150, -250, 128, "Lanto");
    let bigPlanet = this.makePlanet(-350, 150, 96, "Tylon");
    let smallPlanet = this.makePlanet(450, 250, 48, "Atrex");

    this.select(bigPlanet);

    // this.input.on("pointerdown", pointer =>
    //   this.makeShip(pointer.worldX, pointer.worldY)
    // );

    this.input.on("gameobjectdown", this.handleObjectClick, this);
    this.input.on("pointerdown", this.handleEmptyClick, this);

    this.scene.launch("ui");
    this.events.on("destroy", () => {
      this.ships.forEach((ship) => ship.remove());
      this.shipGroup.destroy(true);
      this.planets.forEach((planet) => planet.remove());
      this.planetGroup.destroy(true);
      this.zoomManager = null;
      this.planets = null;
      this.ships = null;
      globalThis.GAME = null;
    });

    // for (let i = 10; i--; ) {
    //   let ship = this.makeShip();
    //   if (bigPlanet.requestOrbit(ship)) {
    //     ship.handleOrbit(0);
    //   } else {
    //     ship.remove();
    //   }
    // }
  }

  /**
   *
   * @param {Phaser.Input.Pointer} pointer
   * @param {Phaser.GameObjects.GameObject} obj
   * @param {Phaser.Types.Input.EventData} event
   */
  handleObjectClick(pointer, obj, event) {
    if (obj.getData("planet") && pointer.primaryDown) {
      let planet = obj.getData("planet");
      if (this.selectedPlanet) {
        // send ships
        if (!this.selectedPlanet.attack(planet, 0.5)) {
          // if no ships to send (attack returns falsy)
          // select planet instead
          // this.select(planet);
          // flash selectUI red
          this.flashSelectUI();
        }
      } else {
        // if no selected planet, select clicked planet
        this.select(planet);
      }
    }
    event.stopPropagation();
  }

  /**
   *
   * @param {Phaser.Input.Pointer} pointer
   */
  handleEmptyClick(pointer) {
    this.select(null);
  }

  flashSelectUI() {
    let flashUI = this.selectUI;
    if (flashUI) {
      let lines = flashUI.getByName("lines");
      if (!flashUI.tweens) this.selectUI.tweens = [];
      flashUI.tweens.push(
        this.tweens.addCounter({
          from: 0,
          to: 255,
          duration: 500,
          ease: Phaser.Math.Easing.Cubic.Out,
          yoyo: false,
          onUpdate: (tween) => {
            const value = Math.floor(tween.getValue());
            lines.each(
              (line) =>
                (line.strokeColor = Phaser.Display.Color.GetColor(
                  255,
                  value,
                  value
                ))
            );
            lines.setAlpha(mapRange(value / 255, [0, 1], [1, lines.alpha]));
            lines.setScale(
              mapRange(
                Math.abs(value / 255 - 0.5),
                [0, 0.5],
                [0.94, lines.scale]
              )
            );
          },
          onComplete: (tween) => {
            arrayRemove(flashUI?.tweens, tween);
            lines.each((line) => (line.strokeColor = 0xffffff));
          },
        })
      );
    }
  }

  /**
   *
   * @param {Planet} planet the planet to select
   */
  select(planet) {
    if (planet && planet !== this.selectedPlanet) {
      this.select(null);
      this.selectedPlanet = planet;
      this.selectUI = this.makeSelectUI(
        planet.visual.x,
        planet.visual.y,
        planet.orbitalRadius - 2
      );
      this.selectUI.setScale(1.5);
      this.selectUI.setAlpha(0);
      // this.selectUI.getByName("lines").setScale(1.03);
      this.selectUI.setVisible(true);
      this.selectUI.tweens = [];
      this.selectUI.tweens.push(
        this.tweens.add({
          targets: this.selectUI,
          alpha: 1,
          scale: 1,
          ease: Phaser.Math.Easing.Cubic.Out,
          duration: 500,
          repeat: 0,
          onComplete: (tween) => {
            if (this.selectUI?.tweens) {
              arrayRemove(this.selectUI.tweens, tween);
              this.selectUI.setScale(1);
              let lines = this.selectUI.getByName("lines");
              lines.setAlpha(1);
              // lines.setScale(1.03);
              this.selectUI.tweens.push(
                this.tweens.add({
                  targets: lines,
                  alpha: 0.5,
                  scale: 1.03, // 1,
                  ease: Phaser.Math.Easing.Sine.InOut,
                  duration: 685,
                  yoyo: true,
                  repeat: -1,
                  onComplete: (blink) => {
                    if (this.selectUI?.tweens)
                      arrayRemove(this.selectUI.tweens, blink);
                  },
                })
              );
            }
          },
        })
      );
    } else {
      if (this.selectUI) {
        let oldSelectUI = this.selectUI;
        this.selectUI = null;
        // let oldSelectedPlanet = this.selectedPlanet;
        if (oldSelectUI.tweens) {
          oldSelectUI.tweens.forEach((tween) => tween.complete());
        }
        oldSelectUI.tween = this.tweens.add({
          targets: oldSelectUI,
          alpha: 0,
          scale: 2,
          ease: Phaser.Math.Easing.Cubic.Out,
          duration: 500,
          repeat: 0,
          onComplete: (tween) => {
            oldSelectUI.setVisible(false);
            oldSelectUI.destroy();
            if (oldSelectUI?.tweens) arrayRemove(oldSelectUI.tweens, tween);
            oldSelectUI.tweens.forEach((tween) => tween.complete());
            delete oldSelectUI.tweens;
          },
        });
      }
      this.selectedPlanet = null;
    }
  }

  update(time, delta) {
    delta /= 1000;
    this.zoomManager.handleZoom();
    this.ships.forEach((ship) => ship.update(time, delta));
    this.planets.forEach((planet) => planet.update(time, delta));
    // console.log(this.tweens);
  }
}

if (!globalThis.GAME) {
  globalThis.GAME = null;
}
