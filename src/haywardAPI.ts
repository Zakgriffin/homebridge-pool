import axios from "axios";
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

export class HaywardAPI {
  constructor(private haywardInfo: HaywardInfo) {}

  async getTelemetry() {
    try {
      const rawResponse = await this.callHaywardAPI("GetTelemetryData", []);

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

      // dumb i just wanna use the HEAT and OFF characteristics
      const currentHeatingCoolingState = heater.attributes["enable"] === "yes" ? 1 : 0;
      const targetHeatingCoolingState = virtualHeater.attributes["enable"] === "yes" ? 1 : 0;

      return { currentTemperature, targetTemperature, currentHeatingCoolingState, targetHeatingCoolingState };
    } catch (error) {
      platform.log.error(error as string);
    }
  }

  // lighting

  async setShow(showID: number) {
    await this.callHaywardAPI(
      "SetStandAloneLightShow",
      [
        param("PoolID", "int", this.haywardInfo.poolID),
        param("LightID", "int", this.haywardInfo.lightID),
        param("Show", "int", showID.toString()),
      ].concat(extraTimerParameters)
    );
  }

  async setLightsOn(isOn: boolean) {
    this.setEquipmentOn(this.haywardInfo.lightID, isOn);
  }

  async setHeaterOn(isOn: boolean) {
    await this.callHaywardAPI(
      "SetHeaterEnable",
      [
        param("PoolID", "int", this.haywardInfo.poolID),
        param("HeaterID", "int", this.haywardInfo.virtualHeaterID),
        param("Enabled", "bool", isOn ? "True" : "False"),
      ].concat(extraTimerParameters)
    );
  }

  async setEquipmentOn(equipmentID: string, isOn: boolean) {
    await this.callHaywardAPI(
      "SetUIEquipmentCmd",
      [
        param("PoolID", "int", this.haywardInfo.poolID),
        param("EquipmentID", "int", equipmentID),
        param("IsOn", "int", isOn ? "100" : "0"),
      ].concat(extraTimerParameters)
    );
  }

  // heater

  async setHeaterTemperature(temperature: number) {
    const temperatureFahrenheit = Math.round(celciusToFahrenheit(temperature));

    await this.callHaywardAPI("SetUIHeaterCmd", [
      param("PoolID", "int", this.haywardInfo.poolID),
      param("HeaterID", "int", this.haywardInfo.heaterID),
      param("Temp", "int", temperatureFahrenheit.toString()),
    ]);
  }

  callHaywardAPI(methodName: string, parameters: HaywardParameter[]) {
    const { token, siteID } = this.haywardInfo;

    const fullParameters = [param("MspSystemID", "int", siteID), param("Version", "string", "0")].concat(parameters);

    return axios.post(
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
  }
}

function parameterToString(parameter: HaywardParameter) {
  return `<Parameter name="${parameter.name}" dataType="${parameter.dataType}">${parameter.value}</Parameter>`;
}

function param(name: string, dataType: string, value: string) {
  return { name, dataType, value };
}

const extraTimerParameters: HaywardParameter[] = [
  param("IsCountDownTimer", "bool", "False"),
  param("StartTimeHours", "int", "0"),
  param("StartTimeMinutes", "int", "0"),
  param("EndTimeHours", "int", "0"),
  param("EndTimeMinutes", "int", "0"),
  param("DaysActive", "int", "0"),
  param("Recurring", "bool", "False"),
];
