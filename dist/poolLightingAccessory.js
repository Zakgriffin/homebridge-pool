"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beginPoolLightingAccessory = void 0;
const platform_1 = require("./platform");
const helpers_1 = require("./helpers");
function beginPoolLightingAccessory(platform, accessory) {
    var _a;
    const Characteristic = platform.Characteristic;
    let isLightOn = false;
    let lightColor = { red: 0, green: 0, blue: 0 };
    let selectedHue = undefined;
    let selectedSaturation = undefined;
    const lightService = (_a = accessory.getService(platform.Service.Lightbulb)) !== null && _a !== void 0 ? _a : accessory.addService(platform.Service.Lightbulb);
    lightService
        .getCharacteristic(Characteristic.On)
        .onGet(() => isLightOn)
        .onSet((i) => {
        isLightOn = i;
        platform_1.haywardAPI.setLightsOn(isLightOn);
    });
    lightService
        .getCharacteristic(Characteristic.Hue)
        .onGet(() => (0, helpers_1.rgbToHsb)(lightColor).hue)
        .onSet((h) => {
        selectedHue = h;
        snapToNearestShow();
    });
    lightService
        .getCharacteristic(Characteristic.Saturation)
        .onGet(() => (0, helpers_1.rgbToHsb)(lightColor).saturation)
        .onSet((s) => {
        selectedSaturation = s;
        snapToNearestShow();
    });
    async function snapToNearestShow() {
        if (selectedHue === undefined || selectedSaturation === undefined)
            return;
        const selectedColorHSB = {
            hue: selectedHue,
            saturation: selectedSaturation,
            brightness: 100,
        };
        let leastDif = Number.MAX_SAFE_INTEGER;
        let nearestShowColor = showColors[0];
        for (const showColor of showColors) {
            const dif = (0, helpers_1.hsbDistance)((0, helpers_1.rgbToHsb)(showColor.color), selectedColorHSB);
            if (dif < leastDif) {
                leastDif = dif;
                nearestShowColor = showColor;
            }
        }
        lightColor = nearestShowColor.color;
        const nearestShowColorHSB = (0, helpers_1.rgbToHsb)(nearestShowColor.color);
        lightService.updateCharacteristic(platform.Characteristic.Hue, nearestShowColorHSB.hue);
        lightService.updateCharacteristic(platform.Characteristic.Saturation, nearestShowColorHSB.saturation);
        selectedHue = undefined;
        selectedSaturation = undefined;
        await platform_1.haywardAPI.setShow(nearestShowColor.id);
    }
    const showColors = [
        { id: 1, color: (0, helpers_1.rgb)(0, 0, 255) },
        { id: 2, color: (0, helpers_1.rgb)(64, 120, 215) },
        { id: 3, color: (0, helpers_1.rgb)(23, 205, 255) },
        { id: 4, color: (0, helpers_1.rgb)(87, 189, 136) },
        { id: 5, color: (0, helpers_1.rgb)(0, 255, 0) },
        { id: 6, color: (0, helpers_1.rgb)(210, 236, 253) },
        { id: 7, color: (0, helpers_1.rgb)(255, 0, 0) },
        { id: 8, color: (0, helpers_1.rgb)(252, 5, 145) },
        { id: 9, color: (0, helpers_1.rgb)(221, 47, 127) },
        { id: 10, color: (0, helpers_1.rgb)(144, 40, 126) },
        { id: 17, color: (0, helpers_1.rgb)(233, 221, 88) },
        { id: 18, color: (0, helpers_1.rgb)(240, 145, 54) },
        { id: 19, color: (0, helpers_1.rgb)(216, 194, 122) },
        { id: 20, color: (0, helpers_1.rgb)(108, 176, 144) },
        { id: 21, color: (0, helpers_1.rgb)(84, 183, 184) },
        { id: 22, color: (0, helpers_1.rgb)(235, 88, 41) },
        { id: 23, color: (0, helpers_1.rgb)(255, 255, 255) },
        { id: 24, color: (0, helpers_1.rgb)(229, 237, 247) },
        { id: 25, color: (0, helpers_1.rgb)(243, 240, 226) },
        { id: 26, color: (0, helpers_1.rgb)(252, 238, 79) }, // bright yellow
    ];
}
exports.beginPoolLightingAccessory = beginPoolLightingAccessory;
//# sourceMappingURL=poolLightingAccessory.js.map