import { Capacitor } from '@capacitor/core';

/** 안드로이드 앱(Capacitor) 안에서 돌고 있는지. 브라우저·PWA면 false */
export const isNative: boolean = (() => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
})();

/** 앱 안에서는 번들된 privacy.html 대신 공개 주소를 외부 브라우저로 연다 */
export const PRIVACY_URL = isNative ? 'https://baebae6ae.github.io/chool_geun/privacy.html' : './privacy.html';
