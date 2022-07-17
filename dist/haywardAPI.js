"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HaywardAPI = void 0;
const axios_1 = __importDefault(require("axios"));
const helpers_1 = require("./helpers");
const xml_js_1 = __importDefault(require("xml-js"));
const platform_1 = require("./platform");
class HaywardAPI {
    constructor(haywardInfo) {
        this.haywardInfo = haywardInfo;
    }
    async getTelemetry() {
        try {
            const rawResponse = await this.callHaywardAPI("GetTelemetryData", []);
            const xml = rawResponse.data;
            const telemetry = xml_js_1.default.xml2js(xml);
            const mainElements = telemetry.elements.find((e) => e.name === "STATUS").elements;
            const bodyOfWater = mainElements.find((e) => e.name === "BodyOfWater");
            const currentTemperatureFahrenheit = bodyOfWater.attributes["waterTemp"];
            const currentTemperature = (0, helpers_1.fahrenheitToCelcius)(currentTemperatureFahrenheit);
            const virtualHeater = mainElements.find((e) => e.name === "VirtualHeater");
            const targetTemperatureFahrenheit = virtualHeater.attributes["Current-Set-Point"];
            const targetTemperature = (0, helpers_1.fahrenheitToCelcius)(targetTemperatureFahrenheit);
            const heater = mainElements.find((e) => e.name === "Heater");
            // dumb i just wanna use the HEAT and OFF characteristics
            const currentHeatingCoolingState = heater.attributes["enable"] === "yes" ? 1 : 0;
            const targetHeatingCoolingState = virtualHeater.attributes["enable"] === "yes" ? 1 : 0;
            return { currentTemperature, targetTemperature, currentHeatingCoolingState, targetHeatingCoolingState };
        }
        catch (error) {
            platform_1.platform.log.error(error);
        }
    }
    // lighting
    async setShow(showID) {
        await this.callHaywardAPI("SetStandAloneLightShow", [
            param("PoolID", "int", this.haywardInfo.poolID),
            param("LightID", "int", this.haywardInfo.lightID),
            param("Show", "int", showID.toString()),
        ].concat(extraTimerParameters));
    }
    async setLightsOn(isOn) {
        this.setEquipmentOn(this.haywardInfo.lightID, isOn);
    }
    async setHeaterOn(isOn) {
        await this.callHaywardAPI("SetHeaterEnable", [
            param("PoolID", "int", this.haywardInfo.poolID),
            param("HeaterID", "int", this.haywardInfo.virtualHeaterID),
            param("Enabled", "bool", isOn ? "True" : "False"),
        ].concat(extraTimerParameters));
    }
    async setEquipmentOn(equipmentID, isOn) {
        await this.callHaywardAPI("SetUIEquipmentCmd", [
            param("PoolID", "int", this.haywardInfo.poolID),
            param("EquipmentID", "int", equipmentID),
            param("IsOn", "int", isOn ? "100" : "0"),
        ].concat(extraTimerParameters));
    }
    // heater
    async setHeaterTemperature(temperature) {
        const temperatureFahrenheit = Math.round((0, helpers_1.celciusToFahrenheit)(temperature));
        await this.callHaywardAPI("SetUIHeaterCmd", [
            param("PoolID", "int", this.haywardInfo.poolID),
            param("HeaterID", "int", this.haywardInfo.heaterID),
            param("Temp", "int", temperatureFahrenheit.toString()),
        ]);
    }
    callHaywardAPI(methodName, parameters) {
        const { token, siteID } = this.haywardInfo;
        const fullParameters = [param("MspSystemID", "int", siteID), param("Version", "string", "0")].concat(parameters);
        return axios_1.default.post("https://www.haywardomnilogic.com/HAAPI/HomeAutomation/API.ashx", `<Request>
        <Name>${methodName}</Name>
        <Parameters>
          ${fullParameters.map(parameterToString).join()}
        </Parameters>
      </Request>`, {
            headers: {
                "content-type": "text/xml",
                "cache-control": "no-cache",
                SiteID: siteID,
                Token: token,
            },
        });
    }
}
exports.HaywardAPI = HaywardAPI;
function parameterToString(parameter) {
    return `<Parameter name="${parameter.name}" dataType="${parameter.dataType}">${parameter.value}</Parameter>`;
}
function param(name, dataType, value) {
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
//# sourceMappingURL=haywardAPI.js.map