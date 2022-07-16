"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beginPoolHeaterAccessory = void 0;
const helpers_1 = require("./helpers");
const platform_1 = require("./platform");
function beginPoolHeaterAccessory(platform, accessory) {
    var _a;
    const Characteristic = platform.Characteristic;
    const { OFF, HEAT } = Characteristic.CurrentHeatingCoolingState;
    const currentHeatingCoolingState = HEAT;
    const targetHeatingCoolingState = HEAT;
    let temperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.FAHRENHEIT;
    const heaterService = (_a = accessory.getService(platform.Service.Thermostat)) !== null && _a !== void 0 ? _a : accessory.addService(platform.Service.Thermostat);
    const heaterServiceHeatingCoolingState = { validValues: [OFF, HEAT] };
    heaterService
        .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
        .setProps(heaterServiceHeatingCoolingState)
        .onGet(() => currentHeatingCoolingState);
    heaterService
        .getCharacteristic(Characteristic.TargetHeatingCoolingState)
        .setProps(heaterServiceHeatingCoolingState)
        .onGet(() => targetHeatingCoolingState);
    const heaterServiceTemperatureProps = {
        minValue: (0, helpers_1.fahrenheitToCelcius)(65),
        maxValue: (0, helpers_1.fahrenheitToCelcius)(90),
    };
    heaterService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setProps(heaterServiceTemperatureProps)
        .onGet(async () => {
        const { currentTemperature } = await platform_1.haywardAPI.getTelemetry();
        return currentTemperature;
    });
    heaterService
        .getCharacteristic(Characteristic.TargetTemperature)
        .setProps(heaterServiceTemperatureProps)
        .onGet(async () => {
        const { targetTemperature } = await platform_1.haywardAPI.getTelemetry();
        return targetTemperature;
    })
        .onSet((t) => {
        platform_1.haywardAPI.setHeaterTemperature(t);
    });
    heaterService
        .getCharacteristic(Characteristic.TemperatureDisplayUnits)
        .onGet(() => temperatureDisplayUnits)
        .onSet((t) => (temperatureDisplayUnits = t));
    const UPDATE_FROM_HAYWARD_PERIOD = 2 * 60 * 1000; // 2 minutes
    setInterval(async () => {
        const { currentTemperature, targetTemperature } = await platform_1.haywardAPI.getTelemetry();
        heaterService.updateCharacteristic(platform.Characteristic.CurrentTemperature, currentTemperature);
        heaterService.updateCharacteristic(platform.Characteristic.TargetTemperature, targetTemperature);
    }, UPDATE_FROM_HAYWARD_PERIOD);
}
exports.beginPoolHeaterAccessory = beginPoolHeaterAccessory;
//# sourceMappingURL=poolHeaterAccessory.js.map