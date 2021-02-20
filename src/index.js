import Phaser from "phaser";
import config from "./js/config/PhaserConfig";
import "./css/main.less";

let game;

function create() {
  if (game) return;
  game = new Phaser.Game(config);
}

function destroy() {
  if (!game) return;
  console.log("reloading");
  location.reload();
}

// enable hot reloading
if (module.hot) {
  module.hot.dispose(destroy);
  module.hot.accept(create);
}

if (!game) create();
