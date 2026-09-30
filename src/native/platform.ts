/**
 * Platform detection utilities for Capacitor hybrid apps.
 * Determines whether the app is running in a native Android WebView
 * or as a standard web browser PWA.
 */

import { Capacitor } from '@capacitor/core';

/** Returns true when running inside a native Capacitor shell (Android APK) */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/** Returns 'android' | 'ios' | 'web' */
export function getPlatform(): string {
  return Capacitor.getPlatform();
}

/** Returns true only on native Android */
export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

/** Returns true when running in a regular browser */
export function isWeb(): boolean {
  return Capacitor.getPlatform() === 'web';
}
