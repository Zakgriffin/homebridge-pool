import { PlatformAccessory } from "homebridge";

import { PoolPlatform, haywardAPI } from "./platform";
import { hsbDistance, rgb, rgbToHsb } from "./helpers";

export function beginPoolLightingAccessory(platform: PoolPlatform, accessory: PlatformAccessory) {
  const Characteristic = platform.Characteristic;

  let isLightOn = false;
  let lightColor = { red: 0, green: 0, blue: 0 };
  let selectedHue: number | undefined = undefined;
  let selectedSaturation: number | undefined = undefined;

  const lightService =
    accessory.getService(platform.Service.Lightbulb) ?? accessory.addService(platform.Service.Lightbulb);

  lightService
    .getCharacteristic(Characteristic.On)
    .onGet(() => isLightOn)
    .onSet((i) => {
      isLightOn = i as boolean;
      haywardAPI.setLightsOn(isLightOn);
    });

  lightService
    .getCharacteristic(Characteristic.Hue)
    .onGet(() => rgbToHsb(lightColor).hue)
    .onSet((h) => {
      selectedHue = h as number;
      snapToNearestShow();
    });

  lightService
    .getCharacteristic(Characteristic.Saturation)
    .onGet(() => rgbToHsb(lightColor).saturation)
    .onSet((s) => {
      selectedSaturation = s as number;
      snapToNearestShow();
    });

  async function snapToNearestShow() {
    if (selectedHue === undefined || selectedSaturation === undefined) return;

    const selectedColorHSB = {
      hue: selectedHue,
      saturation: selectedSaturation,
      brightness: 100,
    };

    let leastDif = Number.MAX_SAFE_INTEGER;
    let nearestShowColor = showColors[0];
    for (const showColor of showColors) {
      const dif = hsbDistance(rgbToHsb(showColor.color), selectedColorHSB);
      if (dif < leastDif) {
        leastDif = dif;
        nearestShowColor = showColor;
      }
    }
    lightColor = nearestShowColor.color;

    const nearestShowColorHSB = rgbToHsb(nearestShowColor.color);
    lightService.updateCharacteristic(platform.Characteristic.Hue, nearestShowColorHSB.hue);
    lightService.updateCharacteristic(platform.Characteristic.Saturation, nearestShowColorHSB.saturation);

    selectedHue = undefined;
    selectedSaturation = undefined;

    await haywardAPI.setShow(nearestShowColor.id);
  }

  const showColors = [
    { id: 1, color: rgb(0, 0, 255) }, // deep sea blue
    { id: 2, color: rgb(64, 120, 215) }, // royal blue
    { id: 3, color: rgb(23, 205, 255) }, // afternoon sky
    { id: 4, color: rgb(87, 189, 136) }, // aqua green
    { id: 5, color: rgb(0, 255, 0) }, // emerald
    { id: 6, color: rgb(210, 236, 253) }, // cloud white
    { id: 7, color: rgb(255, 0, 0) }, // warm red
    { id: 8, color: rgb(252, 5, 145) }, // flamingo
    { id: 9, color: rgb(221, 47, 127) }, // vivid violet
    { id: 10, color: rgb(144, 40, 126) }, // sangria
    { id: 17, color: rgb(233, 221, 88) }, // yellow
    { id: 18, color: rgb(240, 145, 54) }, // orange
    { id: 19, color: rgb(216, 194, 122) }, // gold
    { id: 20, color: rgb(108, 176, 144) }, // mint
    { id: 21, color: rgb(84, 183, 184) }, // teal
    { id: 22, color: rgb(235, 88, 41) }, // burnt orange
    { id: 23, color: rgb(255, 255, 255) }, // pure white
    { id: 24, color: rgb(229, 237, 247) }, // crisp white
    { id: 25, color: rgb(243, 240, 226) }, // warm white
    { id: 26, color: rgb(252, 238, 79) }, // bright yellow
  ];
}
