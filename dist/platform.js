"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolPlatform = exports.platform = exports.haywardAPI = void 0;
const settings_1 = require("./settings");
const poolLightingAccessory_1 = require("./poolLightingAccessory");
const poolHeaterAccessory_1 = require("./poolHeaterAccessory");
const haywardAPI_1 = require("./haywardAPI");
class PoolPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        this.accessories = [];
        exports.platform = this;
        this.log.debug("Finished initializing platform:", this.config.name);
        this.api.on("didFinishLaunching", () => {
            log.debug("Executed didFinishLaunching callback");
            this.discoverDevices();
        });
    }
    configureAccessory(accessory) {
        this.log.info("Loading accessory from cache:", accessory.displayName);
        this.accessories.push(accessory);
    }
    discoverDevices() {
        const { token, siteID, poolID, heaterID, lightID, virtualHeaterID } = this.config;
        if (token == undefined)
            return this.log.error("No hayward token provided!");
        if (siteID == undefined)
            return this.log.error("No siteID provided!");
        if (poolID == undefined)
            return this.log.error("No poolID provided!");
        if (heaterID == undefined)
            return this.log.error("No heaterID provided!");
        if (lightID == undefined)
            return this.log.error("No lightID provided!");
        if (virtualHeaterID == undefined)
            return this.log.error("No virtualHeaterID provided!");
        exports.haywardAPI = new haywardAPI_1.HaywardAPI({ token, siteID, poolID, heaterID, lightID, virtualHeaterID });
        this.startAccessory("Pool Lighting", poolLightingAccessory_1.beginPoolLightingAccessory);
        this.startAccessory("Pool Heater", poolHeaterAccessory_1.beginPoolHeaterAccessory);
    }
    startAccessory(displayName, beginAccessory) {
        const uuid = this.api.hap.uuid.generate(displayName);
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            beginAccessory(this, existingAccessory);
        }
        else {
            const accessory = new this.api.platformAccessory(displayName, uuid);
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            beginAccessory(this, accessory);
        }
    }
}
exports.PoolPlatform = PoolPlatform;
// TODO:
// slow to respond
// error handling for network stuffs
// HeatingCoolingState updating
//# sourceMappingURL=platform.js.map