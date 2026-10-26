/** 어느 화면에서든 제보·응원 시트를 열 수 있게 (App이 받아서 띄운다) */
export type SheetKind = 'report' | 'support';
const EVENT = 'hamster:sheet';

export function openSheet(kind: SheetKind) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: kind }));
}

export function onSheet(fn: (kind: SheetKind) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent<SheetKind>).detail);
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
}
