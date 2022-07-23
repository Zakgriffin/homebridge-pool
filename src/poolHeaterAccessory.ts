import { PlatformAccessory } from "homebridge";
import { fahrenheitToCelcius, makeRateLimitedSetter } from "./helpers";
import { platform } from "./platform";

export function beginPoolHeaterAccessory(accessory: PlatformAccessory) {
  const { haywardAPI, api } = platform;
  const { Characteristic, Service } = api.hap;
  const { OFF, HEAT } = Characteristic.CurrentHeatingCoolingState;

  const heaterService = accessory.getService(Service.Thermostat) ?? accessory.addService(Service.Thermostat);

  const heaterServiceHeatingCoolingState = { validValues: [OFF, HEAT] };

  const MINIMUM_TARGET_TEMPERATURE = fahrenheitToCelcius(60);
  const MAXIMUM_TARGET_TEMPERATURE = fahrenheitToCelcius(90);

  let currentHeatingState = OFF;
  let targetHeatingState = OFF;
  let currentTemperature = MINIMUM_TARGET_TEMPERATURE;
  let targetTemperature = MINIMUM_TARGET_TEMPERATURE;

  const targetTemperatureObservable = makeRateLimitedSetter(0, haywardAPI.setTargetHeaterTemperature, (input) => {
    targetTemperature = input;
    heaterService.updateCharacteristic(Characteristic.TargetTemperature, targetTemperature);
  });

  const targetHeatingStateObservable = makeRateLimitedSetter(0, haywardAPI.setTargetHeatingState, (input) => {
    targetHeatingState = input;
    heaterService.updateCharacteristic(Characteristic.TargetHeatingCoolingState, targetHeatingState);
  });

  heaterService
    .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
    .setProps(heaterServiceHeatingCoolingState)
    .onGet(() => {
      updateFromTelemetry();
      return currentHeatingState;
    });

  heaterService
    .getCharacteristic(Characteristic.TargetHeatingCoolingState)
    .setProps(heaterServiceHeatingCoolingState)
    .onGet(() => {
      updateFromTelemetry();
      return targetHeatingState;
    })
    .onSet((s) => {
      targetHeatingStateObservable.next(s as number);
    });

  heaterService.getCharacteristic(Characteristic.CurrentTemperature).onGet(() => {
    updateFromTelemetry();
    return currentTemperature;
  });

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
      targetTemperatureObservable.next(t as number);
    });

  async function updateFromTelemetry() {
    const telemetry = await haywardAPI.getTelemetry();
    if (telemetry === undefined) return;
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
