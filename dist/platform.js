"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolPlatform = exports.platform = void 0;
const settings_1 = require("./settings");
const poolLightingAccessory_1 = require("./poolLightingAccessory");
const poolHeaterAccessory_1 = require("./poolHeaterAccessory");
const haywardAPI_1 = require("./haywardAPI");
class PoolPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.accessories = [];
        exports.platform = this; // ew global variables are bad wahhh shut up
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
        if (token === undefined)
            return this.log.error("No hayward token provided!");
        if (siteID === undefined)
            return this.log.error("No siteID provided!");
        if (poolID === undefined)
            return this.log.error("No poolID provided!");
        if (heaterID === undefined)
            return this.log.error("No heaterID provided!");
        if (lightID === undefined)
            return this.log.error("No lightID provided!");
        if (virtualHeaterID === undefined)
            return this.log.error("No virtualHeaterID provided!");
        this.haywardAPI = new haywardAPI_1.HaywardAPI({ token, siteID, poolID, heaterID, lightID, virtualHeaterID });
        const poolAccessory = this.getAccessory("Pool Lighting");
        (0, poolLightingAccessory_1.beginPoolLightingAccessory)(poolAccessory);
        const heaterAccessory = this.getAccessory("Pool Heater");
        (0, poolHeaterAccessory_1.beginPoolHeaterAccessory)(heaterAccessory);
    }
    getAccessory(displayName) {
        const uuid = this.api.hap.uuid.generate(displayName);
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            return existingAccessory;
        }
        else {
            const accessory = new this.api.platformAccessory(displayName, uuid);
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            return accessory;
        }
    }
}
exports.PoolPlatform = PoolPlatform;
// proper config error handling
// graphical config
// error handling: failed request, timeout
// interval coincide with set issues
//# sourceMappingURL=platform.js.map