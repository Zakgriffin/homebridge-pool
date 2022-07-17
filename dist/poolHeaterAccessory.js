"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beginPoolHeaterAccessory = void 0;
const helpers_1 = require("./helpers");
const platform_1 = require("./platform");
function beginPoolHeaterAccessory(platform, accessory) {
    var _a;
    const Characteristic = platform.Characteristic;
    const { OFF, HEAT } = Characteristic.CurrentHeatingCoolingState;
    const heaterService = (_a = accessory.getService(platform.Service.Thermostat)) !== null && _a !== void 0 ? _a : accessory.addService(platform.Service.Thermostat);
    const heaterServiceHeatingCoolingState = { validValues: [OFF, HEAT] };
    let currentHeatingCoolingState = OFF;
    heaterService
        .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
        .setProps(heaterServiceHeatingCoolingState)
        .onGet(() => {
        updateFromTelemetry();
        return currentHeatingCoolingState;
    });
    let targetHeatingCoolingState = OFF;
    heaterService
        .getCharacteristic(Characteristic.TargetHeatingCoolingState)
        .setProps(heaterServiceHeatingCoolingState)
        .onGet(() => {
        updateFromTelemetry();
        return targetHeatingCoolingState;
    })
        .onSet((s) => {
        targetHeatingCoolingState = s;
        platform_1.haywardAPI.setHeaterOn(s == HEAT);
    });
    const MINIMUM_TARGET_TEMPERATURE = (0, helpers_1.fahrenheitToCelcius)(60);
    const MAXIMUM_TARGET_TEMPERATURE = (0, helpers_1.fahrenheitToCelcius)(90);
    let currentTemperature = MINIMUM_TARGET_TEMPERATURE;
    heaterService.getCharacteristic(Characteristic.CurrentTemperature).onGet(() => {
        updateFromTelemetry();
        return currentTemperature;
    });
    let targetTemperature = MINIMUM_TARGET_TEMPERATURE;
    heaterService
        .getCharacteristic(Characteristic.TargetTemperature)
        .setProps({
        minValue: MINIMUM_TARGET_TEMPERATURE,
        maxValue: MAXIMUM_TARGET_TEMPERATURE,
    })
        .onGet(() => {
        updateFromTelemetry();
        return targetTemperature;
    })
        .onSet((t) => {
        targetTemperature = t;
        platform_1.haywardAPI.setHeaterTemperature(t);
    });
    async function updateFromTelemetry() {
        const telemetry = await platform_1.haywardAPI.getTelemetry();
        if (telemetry === undefined)
            return;
        ({ currentTemperature, targetTemperature, currentHeatingCoolingState, targetHeatingCoolingState } = telemetry);
        heaterService.updateCharacteristic(platform.Characteristic.CurrentTemperature, currentTemperature);
        heaterService.updateCharacteristic(platform.Characteristic.TargetTemperature, targetTemperature);
        heaterService.updateCharacteristic(platform.Characteristic.CurrentHeaterCoolerState, currentHeatingCoolingState);
        heaterService.updateCharacteristic(platform.Characteristic.TargetHeaterCoolerState, targetHeatingCoolingState);
    }
    const UPDATE_FROM_HAYWARD_INTERVAL = 2 * 60 * 1000; // 2 minutes
    setInterval(updateFromTelemetry, UPDATE_FROM_HAYWARD_INTERVAL);
}
exports.beginPoolHeaterAccessory = beginPoolHeaterAccessory;
//# sourceMappingURL=poolHeaterAccessory.js.map