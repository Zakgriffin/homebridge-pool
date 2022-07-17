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
export declare class HaywardAPI {
    private haywardInfo;
    constructor(haywardInfo: HaywardInfo);
    getTelemetry(): Promise<{
        currentTemperature: number;
        targetTemperature: number;
        currentHeatingCoolingState: number;
        targetHeatingCoolingState: number;
    } | undefined>;
    setShow(showID: number): Promise<void>;
    setLightsOn(isOn: boolean): Promise<void>;
    setHeaterOn(isOn: boolean): Promise<void>;
    setEquipmentOn(equipmentID: string, isOn: boolean): Promise<void>;
    setHeaterTemperature(temperature: number): Promise<void>;
    callHaywardAPI(methodName: string, parameters: HaywardParameter[]): Promise<import("axios").AxiosResponse<any, any>>;
}
export {};
//# sourceMappingURL=haywardAPI.d.ts.map