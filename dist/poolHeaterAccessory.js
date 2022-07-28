"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beginPoolHeaterAccessory = void 0;
const helpers_1 = require("./helpers");
const platform_1 = require("./platform");
function beginPoolHeaterAccessory(accessory) {
    var _a;
    const { haywardAPI, api } = platform_1.platform;
    const { Characteristic, Service } = api.hap;
    const { OFF, HEAT } = Characteristic.CurrentHeatingCoolingState;
    const heaterService = (_a = accessory.getService(Service.Thermostat)) !== null && _a !== void 0 ? _a : accessory.addService(Service.Thermostat);
    const MINIMUM_TARGET_TEMPERATURE = (0, helpers_1.fahrenheitToCelcius)(60);
    const MAXIMUM_TARGET_TEMPERATURE = (0, helpers_1.fahrenheitToCelcius)(90);
    const heatingCoolingStateProps = { validValues: [OFF, HEAT] };
    const temperatureProps = {
        minValue: MINIMUM_TARGET_TEMPERATURE,
        maxValue: MAXIMUM_TARGET_TEMPERATURE,
    };
    let currentHeatingState = OFF;
    let targetHeatingState = OFF;
    let currentTemperature = MINIMUM_TARGET_TEMPERATURE;
    let targetTemperature = MINIMUM_TARGET_TEMPERATURE;
    const targetTemperatureObservable = (0, helpers_1.makeRateLimitedSetter)(0, haywardAPI.setTargetHeaterTemperature, (input) => {
        targetTemperature = input;
        heaterService.updateCharacteristic(Characteristic.TargetTemperature, targetTemperature);
    });
    const targetHeatingStateObservable = (0, helpers_1.makeRateLimitedSetter)(0, haywardAPI.setTargetHeatingState, (input) => {
        targetHeatingState = input;
        heaterService.updateCharacteristic(Characteristic.TargetHeatingCoolingState, targetHeatingState);
    });
    heaterService
        .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
        .setProps(heatingCoolingStateProps)
        .onGet(() => {
        updateFromTelemetry();
        return currentHeatingState;
    });
    heaterService
        .getCharacteristic(Characteristic.TargetHeatingCoolingState)
        .setProps(heatingCoolingStateProps)
        .onGet(() => {
        updateFromTelemetry();
        return targetHeatingState;
    })
        .onSet((s) => {
        targetHeatingStateObservable.next(s);
    });
    heaterService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setProps(temperatureProps)
        .onGet(() => {
        updateFromTelemetry();
        return currentTemperature;
    });
    heaterService
        .getCharacteristic(Characteristic.TargetTemperature)
        .setProps(temperatureProps)
        .onGet(() => {
        updateFromTelemetry();
        return targetTemperature;
    })
        .onSet((t) => {
        targetTemperatureObservable.next(t);
    });
    async function updateFromTelemetry() {
        const telemetry = await haywardAPI.getTelemetry();
        if (telemetry === undefined)
            return;
        ({ currentTemperature, targetTemperature, currentHeatingState, targetHeatingState } = telemetry);
        heaterService.updateCharacteristic(Characteristic.CurrentTemperature, currentTemperature);
        heaterService.updateCharacteristic(Characteristic.CurrentHeatingCoolingState, currentHeatingState);
        heaterService.updateCharacteristic(Characteristic.TargetTemperature, targetTemperature);
        heaterService.updateCharacteristic(Characteristic.TargetHeatingCoolingState, targetHeatingState);
        setTimeout(updateFromTelemetry, UPDATE_FROM_HAYWARD_INTERVAL);
    }
    const UPDATE_FROM_HAYWARD_INTERVAL = 2 * 60 * 1000; // 2 minutes
    updateFromTelemetry();
}
exports.beginPoolHeaterAccessory = beginPoolHeaterAccessory;
//# sourceMappingURL=poolHeaterAccessory.js.map