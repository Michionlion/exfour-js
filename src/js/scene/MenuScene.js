import Phaser from "phaser";
import images from "../../assets/*.png";

const progress_id = "load-progress";

function logProgress(progress) {
  let bar = document.getElementById(progress_id);
  bar.setAttribute("value", progress);
  bar.innerText = `${(progress * 100).toFixed(0)}%`;
  if (progress >= 1) {
    setTimeout(() => {
      if (
        parseFloat(bar.getAttribute("value")) >= 1 &&
        bar.classList.contains("visible")
      )
        bar.removeAttribute("value");
    }, 5000);
  }
}

/**
 * setProgress(true) will end progress logging
 * setProgress(false) will start progress logging
 */
function setProgress(complete) {
  let bar = document.getElementById(progress_id);
  if (complete) {
    bar.classList.remove("visible");
    bar.classList.add("hidden");
  } else {
    bar.classList.remove("hidden");
    bar.classList.add("visible");
  }
}

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "menu" });
  }

  preload() {
    console.table(images);

    for (const key in images) {
      this.load.image(key, images[key]);
    }
    // this.load.image("logo", images.logo);
    // this.load.image("red", images.red);
    // this.load.image("planet", images.planet);
    // this.load.image("planet_sharp", images.planet_sharp);

    setProgress(false);
    this.load.on("progress", logProgress);
    this.load.on("fileprogress", (file) =>
      console.log(`loaded ${file.key} from ${file.src}`)
    );
    this.load.on("complete", () => setProgress(true));
  }

  create() {
    let centerX = this.cameras.main.displayWidth / 2;
    let centerY = this.cameras.main.displayHeight / 2;

    this.add
      .text(centerX, centerY / 2, "ExFour", {
        align: "center",
        fill: "white",
        fontFamily: "monospace",
        fontSize: 48,
      })
      .setOrigin(0.5, 0.5);

    // let planet = this.add
    //   .image(centerX, centerY, "planet")
    //   .setDisplaySize(96, 96)
    //   .setOrigin(0.5, 0.5)
    //   .setInteractive();

    // planet.on("pointerdown", () => this.scene.switch("game"));
  }

  update(time, delta) {
    this.scene.start("game");
  }
}
