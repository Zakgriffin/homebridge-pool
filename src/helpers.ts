import { Subject, throttle } from "rxjs";

export interface ColorRGB {
  red: number; // 0-255
  green: number; // 0-255
  blue: number; // 0-255
}

export interface ColorHSB {
  hue: number; // 0-360
  saturation: number; // 0 - 100
  brightness: number; // 0 - 100
}

export function rgb(red: number, green: number, blue: number): ColorRGB {
  return { red, green, blue };
}

export function hsbToRgb(colorHSB: ColorHSB) {
  const h = colorHSB.hue;
  const s = colorHSB.saturation / 100;
  const b = colorHSB.brightness / 100;

  const k = (n: number) => (n + h / 60) % 6;
  const f = (n: number) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
  return {
    red: 255 * f(5),
    green: 255 * f(3),
    blue: 255 * f(1),
  };
}

export function rgbToHsb(colorRgb: ColorRGB) {
  const r = colorRgb.red / 255;
  const g = colorRgb.green / 255;
  const b = colorRgb.blue / 255;

  const v = Math.max(r, g, b),
    n = v - Math.min(r, g, b);
  const h = n === 0 ? 0 : n && v === r ? (g - b) / n : v === g ? 2 + (b - r) / n : 4 + (r - g) / n;
  return {
    hue: 60 * (h < 0 ? h + 6 : h),
    saturation: v && (n / v) * 100,
    brightness: v * 100,
  };
}

export function rgbDistance(a: ColorRGB, b: ColorRGB) {
  const redDifference = a.red - b.red;
  const greenDifference = a.green - b.green;
  const blueDifference = a.blue - b.blue;

  return redDifference * redDifference + greenDifference * greenDifference + blueDifference * blueDifference;
}

export function hsbDistance(a: ColorHSB, b: ColorHSB) {
  const hueDifference = a.hue - b.hue;
  const saturationDifference = a.saturation - b.saturation;
  const brightnessDifference = a.brightness - b.brightness;

  return (
    hueDifference * hueDifference +
    saturationDifference * saturationDifference +
    brightnessDifference * brightnessDifference
  );
}

export function fahrenheitToCelcius(celcius: number) {
  return (celcius - 32) * (5 / 9);
}

export function celciusToFahrenheit(celcius: number) {
  return celcius * (9 / 5) + 32;
}

export function makeRateLimitedSetter<I, O>(asyncSetter: (input: I) => Promise<O>, onSuccess: (input: I) => void) {
  const observable = new Subject<I>();
  const observableDone = new Subject<void>();

  observable.pipe(throttle(() => observableDone, { leading: true, trailing: true })).subscribe(async (input) => {
    const success = await asyncSetter(input);
    if (success !== undefined) onSuccess(input);

    setTimeout(() => {
      observableDone.next();
    }, 3000);
  });

  return observable;
}
