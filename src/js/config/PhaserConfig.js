import Phaser from "phaser";
import MenuScene from "../scene/MenuScene";
import GameScene from "../scene/GameScene";
import UIScene from "../scene/UIScene";

export default {
  type: Phaser.WEBGL,
  scale: {
    fullscreenTarget: "app",
    parent: "app",
    width: "100%",
    height: "100%",
    mode: Phaser.Scale.ScaleModes.RESIZE,
  },
  fps: {
    min: 30,
    target: 60,
    deltaHistory: 10,
    panicMax: 120,
    smoothStep: true,
  },
  title: "ExFour",
  url: "http://exfour.saejinmh.com",
  disableContextMenu: true,
  banner: {
    text: "white",
    background: ["#FD7400", "#FFE11A", "#BEDB39", "#1F8A70", "#004358"],
  },
  scene: [MenuScene, GameScene, UIScene],
  enableDebug: false,
};
