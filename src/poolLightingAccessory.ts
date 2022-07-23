import { PlatformAccessory } from "homebridge";

import { platform } from "./platform";
import { hsbDistance, rgb, rgbToHsb, makeRateLimitedSetter } from "./helpers";

export function beginPoolLightingAccessory(accessory: PlatformAccessory) {
  const { haywardAPI, api } = platform;
  const { Characteristic, Service } = api.hap;

  let isLightOn = false;
  let lightColor = { red: 0, green: 0, blue: 0 };

  let selectedHue: number | undefined = undefined;
  let selectedSaturation: number | undefined = undefined;

  const isLightOnObservable = makeRateLimitedSetter(3000, haywardAPI.setLightsOn, (input) => {
    isLightOn = input;
    lightService.updateCharacteristic(Characteristic.On, isLightOn);
  });

  const showObservable = makeRateLimitedSetter(3000, haywardAPI.setShow, (input) => {
    const col = showColors.find((c) => c.id === input);
    if (col === undefined) return;

    lightColor = col.color;
    const { hue, saturation } = rgbToHsb(lightColor);
    lightService.updateCharacteristic(Characteristic.Hue, hue);
    lightService.updateCharacteristic(Characteristic.Saturation, saturation);
  });

  const lightService = accessory.getService(Service.Lightbulb) ?? accessory.addService(Service.Lightbulb);

  lightService
    .getCharacteristic(Characteristic.On)
    .onGet(() => isLightOn)
    .onSet((i) => {
      isLightOnObservable.next(i as boolean);
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

  function snapToNearestShow() {
    if (selectedHue === undefined || selectedSaturation === undefined) return;

    const selectedColorHSB = {
      hue: selectedHue,
      saturation: selectedSaturation,
      brightness: 100,
    };

    selectedHue = undefined;
    selectedSaturation = undefined;

    let leastDif = Number.MAX_SAFE_INTEGER;
    let nearestShowColor = showColors[0];
    for (const showColor of showColors) {
      const dif = hsbDistance(rgbToHsb(showColor.color), selectedColorHSB);
      if (dif < leastDif) {
        leastDif = dif;
        nearestShowColor = showColor;
      }
    }

    showObservable.next(nearestShowColor.id);
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

  setInterval(() => {
    if (selectedHue !== undefined || selectedSaturation !== undefined) {
      platform.log.error(`Color desync happened: hue: ${selectedHue}, saturation : ${selectedSaturation}`);
    }
  }, 1000);
}
