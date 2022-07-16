import { PlatformAccessory } from "homebridge";
import { PoolPlatform } from "./platform";
import { fahrenheitToCelcius } from "./helpers";
import { haywardAPI } from "./platform";

export function beginPoolHeaterAccessory(platform: PoolPlatform, accessory: PlatformAccessory) {
  const Characteristic = platform.Characteristic;
  const { OFF, HEAT } = Characteristic.CurrentHeatingCoolingState;

  const currentHeatingCoolingState = HEAT;
  const targetHeatingCoolingState = HEAT;
  let temperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.FAHRENHEIT;

  const heaterService =
    accessory.getService(platform.Service.Thermostat) ?? accessory.addService(platform.Service.Thermostat);

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
    minValue: fahrenheitToCelcius(65),
    maxValue: fahrenheitToCelcius(90),
  };

  heaterService
    .getCharacteristic(Characteristic.CurrentTemperature)
    .setProps(heaterServiceTemperatureProps)
    .onGet(async () => {
      const { currentTemperature } = await haywardAPI.getTelemetry();
      return currentTemperature;
    });

  heaterService
    .getCharacteristic(Characteristic.TargetTemperature)
    .setProps(heaterServiceTemperatureProps)
    .onGet(async () => {
      const { targetTemperature } = await haywardAPI.getTelemetry();
      return targetTemperature;
    })
    .onSet((t) => {
      haywardAPI.setHeaterTemperature(t as number);
    });

  heaterService
    .getCharacteristic(Characteristic.TemperatureDisplayUnits)
    .onGet(() => temperatureDisplayUnits)
    .onSet((t) => (temperatureDisplayUnits = t as number));

  const UPDATE_FROM_HAYWARD_PERIOD = 2 * 60 * 1000; // 2 minutes

  setInterval(async () => {
    const { currentTemperature, targetTemperature } = await haywardAPI.getTelemetry();

    heaterService.updateCharacteristic(platform.Characteristic.CurrentTemperature, currentTemperature);
    heaterService.updateCharacteristic(platform.Characteristic.TargetTemperature, targetTemperature);
  }, UPDATE_FROM_HAYWARD_PERIOD);
}
