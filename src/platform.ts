import {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
} from "homebridge";

import { PLATFORM_NAME, PLUGIN_NAME } from "./settings";
import { beginPoolLightingAccessory } from "./poolLightingAccessory";
import { beginPoolHeaterAccessory } from "./poolHeaterAccessory";
import { HaywardAPI } from "./haywardAPI";

export let haywardAPI: HaywardAPI;
export let platform: PoolPlatform;

export class PoolPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  public readonly accessories: PlatformAccessory[] = [];

  constructor(public readonly log: Logger, public readonly config: PlatformConfig, public readonly api: API) {
    platform = this;

    this.log.debug("Finished initializing platform:", this.config.name);

    this.api.on("didFinishLaunching", () => {
      log.debug("Executed didFinishLaunching callback");
      this.discoverDevices();
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info("Loading accessory from cache:", accessory.displayName);
    this.accessories.push(accessory);
  }

  discoverDevices() {
    const { token, siteID, poolID, heaterID, lightID, virtualHeaterID } = this.config;

    if (token == undefined) return this.log.error("No hayward token provided!");
    if (siteID == undefined) return this.log.error("No siteID provided!");
    if (poolID == undefined) return this.log.error("No poolID provided!");
    if (heaterID == undefined) return this.log.error("No heaterID provided!");
    if (lightID == undefined) return this.log.error("No lightID provided!");
    if (virtualHeaterID == undefined) return this.log.error("No virtualHeaterID provided!");

    haywardAPI = new HaywardAPI({ token, siteID, poolID, heaterID, lightID, virtualHeaterID });

    this.startAccessory("Pool Lighting", beginPoolLightingAccessory);
    this.startAccessory("Pool Heater", beginPoolHeaterAccessory);
  }

  private startAccessory(
    displayName: string,
    beginAccessory: (platform: PoolPlatform, accessory: PlatformAccessory) => void
  ) {
    const uuid = this.api.hap.uuid.generate(displayName);
    const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);

    if (existingAccessory) {
      beginAccessory(this, existingAccessory);
    } else {
      const accessory = new this.api.platformAccessory(displayName, uuid);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      beginAccessory(this, accessory);
    }
  }
}
