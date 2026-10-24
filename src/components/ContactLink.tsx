/**
 * 문의·제안: 누르면 메일 앱이 열리고 제목과 앱 버전·기기 정보가 미리 채워진다.
 * 오류 화면에서는 오류 내용도 함께 붙인다.
 */
import { useEffect, useState } from 'react';
import { isNative } from '../platform';

export const CONTACT_EMAIL = 'eowns0606@gmail.com';

function mailto(appInfo: string, error?: string): string {
  const body = [
    '(여기에 문의·제안 내용을 적어 주세요)',
    '',
    '',
    '---',
    `앱: ${appInfo}`,
    `기기: ${typeof navigator === 'undefined' ? '' : navigator.userAgent}`,
    ...(error ? [`오류: ${error}`] : []),
  ].join('\n');
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('[햄스터 출근일지] 문의·제안')}&body=${encodeURIComponent(body)}`;
}

export function ContactLink({ error, children = '문의·제안' }: { error?: string; children?: React.ReactNode }) {
  const [info, setInfo] = useState(isNative ? '안드로이드 앱' : '웹');
  useEffect(() => {
    if (!isNative) return;
    import('@capacitor/app')
      .then(({ App }) => App.getInfo())
      .then((i) => setInfo(`안드로이드 앱 ${i.version} (빌드 ${i.build})`))
      .catch(() => {});
  }, []);
  return <a href={mailto(info, error)}>{children}</a>;
}
