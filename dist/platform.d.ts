import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig } from "homebridge";
import { HaywardAPI } from "./haywardAPI";
export declare let platform: PoolPlatform;
export declare class PoolPlatform implements DynamicPlatformPlugin {
    readonly log: Logger;
    readonly config: PlatformConfig;
    readonly api: API;
    haywardAPI: HaywardAPI;
    readonly accessories: PlatformAccessory[];
    constructor(log: Logger, config: PlatformConfig, api: API);
    configureAccessory(accessory: PlatformAccessory): void;
    discoverDevices(): void;
    private getAccessory;
}
//# sourceMappingURL=platform.d.ts.map