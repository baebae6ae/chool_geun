/**
 * 안드로이드 뒤로가기 버튼.
 * 열려 있는 팝업·시트·설정 화면을 가장 나중에 열린 것부터 하나씩 닫고,
 * 닫을 게 없으면 앱을 내린다(홈 화면으로). 앱이 통째로 꺼지지 않게 한다.
 */
import { useEffect, useRef } from 'react';
import { isNative } from './platform';

type Handler = () => void;
const stack: { id: number; fn: Handler }[] = [];
let seq = 0;

/** 가장 나중에 열린 것을 닫는다. 닫을 게 없으면 false */
export function handleBack(): boolean {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top.fn();
  return true;
}

/** active인 동안 뒤로가기를 이 동작으로 처리한다 (나중에 켜진 것이 먼저) */
export function useBackHandler(active: boolean, onBack: Handler) {
  const ref = useRef(onBack);
  ref.current = onBack;
  useEffect(() => {
    if (!active) return;
    const id = ++seq;
    stack.push({ id, fn: () => ref.current() });
    return () => {
      const i = stack.findIndex((e) => e.id === id);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [active]);
}

let installed = false;
export function installBackButton() {
  if (!isNative || installed) return;
  installed = true;
  import('@capacitor/app')
    .then(({ App }) => {
      App.addListener('backButton', () => {
        if (!handleBack()) App.minimizeApp().catch(() => {});
      }).catch(() => {});
    })
    .catch(() => {});
}
