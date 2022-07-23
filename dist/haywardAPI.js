"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HaywardAPI = void 0;
const axios_1 = __importStar(require("axios"));
const helpers_1 = require("./helpers");
const xml_js_1 = __importDefault(require("xml-js"));
const platform_1 = require("./platform");
const MINIMUM_TIME_BETWEEN_API_CALLS = 100;
class HaywardAPI {
    constructor(haywardInfo) {
        this.haywardInfo = haywardInfo;
        this.getTelemetry = async () => {
            const timeNow = new Date().getTime();
            if (this.recentTelemetry !== undefined &&
                this.recentTelemetry.timeReceived > timeNow + MINIMUM_TIME_BETWEEN_API_CALLS) {
                return this.recentTelemetry.telemetry;
            }
            try {
                const rawResponse = await this.callHaywardAPI("GetTelemetryData", []);
                if (rawResponse === undefined)
                    return;
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
                const { HEAT, OFF } = platform_1.platform.api.hap.Characteristic.TargetHeatingCoolingState;
                const currentHeatingState = heater.attributes["enable"] === "yes" ? HEAT : OFF;
                const targetHeatingState = virtualHeater.attributes["enable"] === "yes" ? HEAT : OFF;
                return { currentTemperature, targetTemperature, currentHeatingState, targetHeatingState };
            }
            catch (error) {
                if (error instanceof TypeError) {
                    platform_1.platform.log.error("Type error in getTelemetry, API may have changed?");
                    return;
                }
                platform_1.platform.log.error("Unhandled error from axios during getTelemetry");
            }
        };
        // lighting
        this.setShow = async (showID) => {
            return await this.callHaywardAPI("SetStandAloneLightShow", [
                param("PoolID", "int", this.haywardInfo.poolID),
                param("LightID", "int", this.haywardInfo.lightID),
                param("Show", "int", showID.toString()),
                ...extraTimerParameters,
            ]);
        };
        this.setLightsOn = async (isOn) => {
            return this.setEquipmentOn(this.haywardInfo.lightID, isOn);
        };
        this.setTargetHeatingState = async (heatingState) => {
            const { HEAT } = platform_1.platform.api.hap.Characteristic.TargetHeatingCoolingState;
            return await this.callHaywardAPI("SetHeaterEnable", [
                param("PoolID", "int", this.haywardInfo.poolID),
                param("HeaterID", "int", this.haywardInfo.virtualHeaterID),
                param("Enabled", "bool", heatingState === HEAT ? "True" : "False"),
                ...extraTimerParameters,
            ]);
        };
        this.setEquipmentOn = async (equipmentID, isOn) => {
            return await this.callHaywardAPI("SetUIEquipmentCmd", [
                param("PoolID", "int", this.haywardInfo.poolID),
                param("EquipmentID", "int", equipmentID),
                param("IsOn", "int", isOn ? "100" : "0"),
                ...extraTimerParameters,
            ]);
        };
        // heater
        this.setTargetHeaterTemperature = async (targetHeaterTemperature) => {
            const targetHeaterTemperatureFahrenheit = Math.round((0, helpers_1.celciusToFahrenheit)(targetHeaterTemperature));
            return await this.callHaywardAPI("SetUIHeaterCmd", [
                param("PoolID", "int", this.haywardInfo.poolID),
                param("HeaterID", "int", this.haywardInfo.heaterID),
                param("Temp", "int", targetHeaterTemperatureFahrenheit.toString()),
            ]);
        };
        this.callHaywardAPI = async (methodName, parameters) => {
            const { token, siteID } = this.haywardInfo;
            const fullParameters = [param("MspSystemID", "int", siteID), param("Version", "string", "0"), ...parameters];
            try {
                const response = await axios_1.default.post("https://www.haywardomnilogic.com/HAAPI/HomeAutomation/API.ashx", `<Request>
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
                // if (response.succeeded) {
                return response;
                // }
            }
            catch (error) {
                if (error instanceof axios_1.AxiosError && error.code === "ENOTFOUND") {
                    platform_1.platform.log.error("Hayward domain not found");
                }
                platform_1.platform.log.error("Unhandled error from axios during callHaywardAPI");
            }
            return undefined;
        };
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