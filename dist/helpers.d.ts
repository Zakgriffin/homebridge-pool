import { Subject } from "rxjs";
export interface ColorRGB {
    red: number;
    green: number;
    blue: number;
}
export interface ColorHSB {
    hue: number;
    saturation: number;
    brightness: number;
}
export declare function rgb(red: number, green: number, blue: number): ColorRGB;
export declare function hsbToRgb(colorHSB: ColorHSB): {
    red: number;
    green: number;
    blue: number;
};
export declare function rgbToHsb(colorRgb: ColorRGB): {
    hue: number;
    saturation: number;
    brightness: number;
};
export declare function rgbDistance(a: ColorRGB, b: ColorRGB): number;
export declare function hsbDistance(a: ColorHSB, b: ColorHSB): number;
export declare function fahrenheitToCelcius(celcius: number): number;
export declare function celciusToFahrenheit(celcius: number): number;
export declare function makeRateLimitedSetter<I, O>(extra_delay: number, asyncSetter: (input: I) => Promise<O>, onSuccess: (input: I) => void): Subject<I>;
//# sourceMappingURL=helpers.d.ts.map