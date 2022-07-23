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
export declare class HaywardAPI {
    private haywardInfo;
    recentTelemetry?: {
        telemetry: Telemetry;
        timeReceived: number;
    };
    constructor(haywardInfo: HaywardInfo);
    getTelemetry(): Promise<Telemetry | undefined>;
    setShow: (showID: number) => Promise<import("axios").AxiosResponse<any, any> | undefined>;
    setLightsOn(isOn: boolean): Promise<void>;
    setTargetHeatingState(heatingState: number): Promise<import("axios").AxiosResponse<any, any> | undefined>;
    setEquipmentOn(equipmentID: string, isOn: boolean): Promise<void>;
    setTargetHeaterTemperature(targetHeaterTemperature: number): Promise<import("axios").AxiosResponse<any, any> | undefined>;
    a(x: any, value: any): Promise<void>;
    callHaywardAPI(methodName: string, parameters: HaywardParameter[]): Promise<import("axios").AxiosResponse<any, any> | undefined>;
}
export {};
//# sourceMappingURL=haywardAPI.d.ts.map