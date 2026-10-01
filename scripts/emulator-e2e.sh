#!/usr/bin/env bash
# 에뮬레이터가 켜진 상태에서 실행: 앱 설치 → 실행 → 웹뷰에 연결해 화면 점검
set -u
PKG=io.github.baebae6ae.hamsterworklog
APK=android/app/build/outputs/apk/debug/app-debug.apk
OUT=e2e-out
mkdir -p "$OUT"

adb wait-for-device
adb shell input keyevent 82 || true
adb install -r "$APK"
adb logcat -c
adb shell am start -W -n "$PKG/.MainActivity"
sleep 12
adb exec-out screencap -p > "$OUT/01-device-launch.png"

PID=$(adb shell pidof "$PKG" | tr -d '\r')
echo "app pid=$PID"
if [ -z "$PID" ]; then
  echo "앱 프로세스가 없음 (실행 직후 종료됨)"
  adb logcat -d > "$OUT/logcat.txt"
  exit 1
fi
adb forward tcp:9222 "localabstract:webview_devtools_remote_$PID"

STATUS=0
node scripts/emulator-e2e.mjs || STATUS=$?

adb exec-out screencap -p > "$OUT/99-device-final.png" || true
adb logcat -d > "$OUT/logcat.txt" || true
grep -E "FATAL EXCEPTION|AndroidRuntime|Capacitor|chromium.*(ERROR|Uncaught)|Console" "$OUT/logcat.txt" | head -60 > "$OUT/logcat-important.txt" || true
echo "----- logcat (중요 줄) -----"
cat "$OUT/logcat-important.txt" | cut -c1-300 || true
exit $STATUS
