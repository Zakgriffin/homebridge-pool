"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.celciusToFahrenheit = exports.fahrenheitToCelcius = exports.hsbDistance = exports.rgbDistance = exports.rgbToHsb = exports.hsbToRgb = exports.rgb = void 0;
function rgb(red, green, blue) {
    return { red, green, blue };
}
exports.rgb = rgb;
function hsbToRgb(colorHSB) {
    const h = colorHSB.hue;
    const s = colorHSB.saturation / 100;
    const b = colorHSB.brightness / 100;
    const k = (n) => (n + h / 60) % 6;
    const f = (n) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
    return {
        red: 255 * f(5),
        green: 255 * f(3),
        blue: 255 * f(1),
    };
}
exports.hsbToRgb = hsbToRgb;
function rgbToHsb(colorRgb) {
    const r = colorRgb.red / 255;
    const g = colorRgb.green / 255;
    const b = colorRgb.blue / 255;
    const v = Math.max(r, g, b), n = v - Math.min(r, g, b);
    const h = n === 0 ? 0 : n && v === r ? (g - b) / n : v === g ? 2 + (b - r) / n : 4 + (r - g) / n;
    return {
        hue: 60 * (h < 0 ? h + 6 : h),
        saturation: v && (n / v) * 100,
        brightness: v * 100,
    };
}
exports.rgbToHsb = rgbToHsb;
function rgbDistance(a, b) {
    const redDifference = a.red - b.red;
    const greenDifference = a.green - b.green;
    const blueDifference = a.blue - b.blue;
    return redDifference * redDifference + greenDifference * greenDifference + blueDifference * blueDifference;
}
exports.rgbDistance = rgbDistance;
function hsbDistance(a, b) {
    const hueDifference = a.hue - b.hue;
    const saturationDifference = a.saturation - b.saturation;
    const brightnessDifference = a.brightness - b.brightness;
    return (hueDifference * hueDifference +
        saturationDifference * saturationDifference +
        brightnessDifference * brightnessDifference);
}
exports.hsbDistance = hsbDistance;
function fahrenheitToCelcius(celcius) {
    return (celcius - 32) * (5 / 9);
}
exports.fahrenheitToCelcius = fahrenheitToCelcius;
function celciusToFahrenheit(celcius) {
    return celcius * (9 / 5) + 32;
}
exports.celciusToFahrenheit = celciusToFahrenheit;
//# sourceMappingURL=helpers.js.map