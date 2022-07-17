import { PlatformAccessory } from "homebridge";
import { PoolPlatform } from "./platform";
import { fahrenheitToCelcius } from "./helpers";
import { haywardAPI } from "./platform";

export function beginPoolHeaterAccessory(platform: PoolPlatform, accessory: PlatformAccessory) {
  const Characteristic = platform.Characteristic;
  const { OFF, HEAT } = Characteristic.CurrentHeatingCoolingState;

  const heaterService =
    accessory.getService(platform.Service.Thermostat) ?? accessory.addService(platform.Service.Thermostat);

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
      targetHeatingCoolingState = s as number;
      haywardAPI.setHeaterOn(s == HEAT);
    });

  const MINIMUM_TARGET_TEMPERATURE = fahrenheitToCelcius(60);
  const MAXIMUM_TARGET_TEMPERATURE = fahrenheitToCelcius(90);
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
      targetTemperature = t as number;
      haywardAPI.setHeaterTemperature(t as number);
    });

  async function updateFromTelemetry() {
    const telemetry = await haywardAPI.getTelemetry();
    if (telemetry === undefined) return;

    ({ currentTemperature, targetTemperature, currentHeatingCoolingState, targetHeatingCoolingState } = telemetry);

    heaterService.updateCharacteristic(platform.Characteristic.CurrentTemperature, currentTemperature);
    heaterService.updateCharacteristic(platform.Characteristic.TargetTemperature, targetTemperature);
    heaterService.updateCharacteristic(platform.Characteristic.CurrentHeaterCoolerState, currentHeatingCoolingState);
    heaterService.updateCharacteristic(platform.Characteristic.TargetHeaterCoolerState, targetHeatingCoolingState);
  }

  const UPDATE_FROM_HAYWARD_INTERVAL = 2 * 60 * 1000; // 2 minutes
  setInterval(updateFromTelemetry, UPDATE_FROM_HAYWARD_INTERVAL);
}
