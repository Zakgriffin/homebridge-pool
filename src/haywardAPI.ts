import axios, { AxiosError } from "axios";
import { celciusToFahrenheit, fahrenheitToCelcius } from "./helpers";
import convert from "xml-js";
import { platform } from "./platform";

interface HaywardInfo {
  token: string;
  siteID: string;
  poolID: string;
  heaterID: string;
  lightID: string;
  virtualHeaterID: string;
}

interface HaywardParameter {
  name: string;
  dataType: string;
  value: string;
}

interface Telemetry {
  currentTemperature: number;
  targetTemperature: number;
  currentHeatingState: number;
  targetHeatingState: number;
}

const MINIMUM_TIME_BETWEEN_API_CALLS = 100;

export class HaywardAPI {
  recentTelemetry?: {
    telemetry: Telemetry;
    timeReceived: number;
  };

  constructor(private haywardInfo: HaywardInfo) {}

  getTelemetry = async () => {
    const timeNow = new Date().getTime();
    if (
      this.recentTelemetry !== undefined &&
      this.recentTelemetry.timeReceived > timeNow + MINIMUM_TIME_BETWEEN_API_CALLS
    ) {
      return this.recentTelemetry.telemetry;
    }

    try {
      const rawResponse = await this.callHaywardAPI("GetTelemetryData", []);
      if (rawResponse === undefined) return;

      const xml = rawResponse.data;
      const telemetry = convert.xml2js(xml);

      const mainElements = telemetry.elements.find((e) => e.name === "STATUS").elements;

      const bodyOfWater = mainElements.find((e) => e.name === "BodyOfWater");
      const currentTemperatureFahrenheit = bodyOfWater.attributes["waterTemp"];
      const currentTemperature = fahrenheitToCelcius(currentTemperatureFahrenheit);

      const virtualHeater = mainElements.find((e) => e.name === "VirtualHeater");
      const targetTemperatureFahrenheit = virtualHeater.attributes["Current-Set-Point"];
      const targetTemperature = fahrenheitToCelcius(targetTemperatureFahrenheit);

      const heater = mainElements.find((e) => e.name === "Heater");

      const { HEAT, OFF } = platform.api.hap.Characteristic.TargetHeatingCoolingState;
      const currentHeatingState = heater.attributes["enable"] === "yes" ? HEAT : OFF;
      const targetHeatingState = virtualHeater.attributes["enable"] === "yes" ? HEAT : OFF;

      return { currentTemperature, targetTemperature, currentHeatingState, targetHeatingState };
    } catch (error) {
      if (error instanceof TypeError) {
        platform.log.error("Type error in getTelemetry, API may have changed?");
        return;
      } else {
        platform.log.error("Unhandled error from axios during getTelemetry");
      }
      platform.log.error(error as string);
    }
  };

  // lighting

  setShow = async (showID: number) => {
    return await this.callHaywardAPI("SetStandAloneLightShow", [
      param("PoolID", "int", this.haywardInfo.poolID),
      param("LightID", "int", this.haywardInfo.lightID),
      param("Show", "int", showID.toString()),
      ...extraTimerParameters,
    ]);
  };

  setLightsOn = async (isOn: boolean) => {
    return this.setEquipmentOn(this.haywardInfo.lightID, isOn);
  };

  setTargetHeatingState = async (heatingState: number) => {
    const { HEAT } = platform.api.hap.Characteristic.TargetHeatingCoolingState;

    return await this.callHaywardAPI("SetHeaterEnable", [
      param("PoolID", "int", this.haywardInfo.poolID),
      param("HeaterID", "int", this.haywardInfo.virtualHeaterID),
      param("Enabled", "bool", heatingState === HEAT ? "True" : "False"),
      ...extraTimerParameters,
    ]);
  };

  setEquipmentOn = async (equipmentID: string, isOn: boolean) => {
    return await this.callHaywardAPI("SetUIEquipmentCmd", [
      param("PoolID", "int", this.haywardInfo.poolID),
      param("EquipmentID", "int", equipmentID),
      param("IsOn", "int", isOn ? "100" : "0"),
      ...extraTimerParameters,
    ]);
  };

  // heater

  setTargetHeaterTemperature = async (targetHeaterTemperature: number) => {
    const targetHeaterTemperatureFahrenheit = Math.round(celciusToFahrenheit(targetHeaterTemperature));
    return await this.callHaywardAPI("SetUIHeaterCmd", [
      param("PoolID", "int", this.haywardInfo.poolID),
      param("HeaterID", "int", this.haywardInfo.heaterID),
      param("Temp", "int", targetHeaterTemperatureFahrenheit.toString()),
    ]);
  };

  callHaywardAPI = async (methodName: string, parameters: HaywardParameter[]) => {
    const { token, siteID } = this.haywardInfo;

    const fullParameters = [param("MspSystemID", "int", siteID), param("Version", "string", "0"), ...parameters];

    try {
      const response = await axios.post(
        "https://www.haywardomnilogic.com/HAAPI/HomeAutomation/API.ashx",

        `<Request>
          <Name>${methodName}</Name>
          <Parameters>
            ${fullParameters.map(parameterToString).join()}
          </Parameters>
        </Request>`,
        {
          headers: {
            "content-type": "text/xml",
            "cache-control": "no-cache",
            SiteID: siteID,
            Token: token,
          },
        }
      );
      // if (response.succeeded) {
      return response;
      // }
    } catch (error) {
      if (error instanceof AxiosError && error.code === "ENOTFOUND") {
        platform.log.error("Hayward domain not found");
      }

      platform.log.error("Unhandled error from axios during callHaywardAPI");
      platform.log.error(error as string);
    }
    return undefined;
  };
}

function parameterToString(parameter: HaywardParameter) {
  return `<Parameter name="${parameter.name}" dataType="${parameter.dataType}">${parameter.value}</Parameter>`;
}

function param(name: string, dataType: string, value: string) {
  return { name, dataType, value };
}

const extraTimerParameters = [
  param("IsCountDownTimer", "bool", "False"),
  param("StartTimeHours", "int", "0"),
  param("StartTimeMinutes", "int", "0"),
  param("EndTimeHours", "int", "0"),
  param("EndTimeMinutes", "int", "0"),
  param("DaysActive", "int", "0"),
  param("Recurring", "bool", "False"),
];
