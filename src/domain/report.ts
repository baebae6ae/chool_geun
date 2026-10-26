/**
 * 썰·대화 제보: 앱 안에서 쓰고 Google 폼으로 보낸다 (서버 없음).
 * 폼 주소와 항목 번호는 Google 폼의 「미리 채워진 링크」에서 얻는다. 아직 없으면 보내는 시늉만 한다(개발용).
 */
export type ReportKind = 'chat' | 'story';

export const REPORT_KINDS: { id: ReportKind; emoji: string; label: string; hint: string }[] = [
  { id: 'chat', emoji: '💬', label: '어이없는 업무 대화', hint: '받은 메시지와 그때 하고 싶었던 사이다 답장을 적어 주세요' },
  { id: 'story', emoji: '🎬', label: '직장 썰', hint: '무슨 일이 있었는지 편하게 적어 주세요. 짧아도 좋아요' },
];

export interface ReportForm {
  /** https://docs.google.com/forms/d/e/<폼 ID>/formResponse */
  action: string;
  /** 각 항목의 entry 번호 */
  kind: string;
  text: string;
  nick: string;
  agree: string;
  /** 폼에서 쓰는 선택지 글자 그대로 */
  kindValue: Record<ReportKind, string>;
  agreeValue: string;
}

/** 제보용 Google 폼 (미리 채워진 링크에서 얻은 항목 번호와 선택지 글자) */
export const REPORT_FORM: ReportForm | null = {
  action: 'https://docs.google.com/forms/d/e/1FAIpQLSd2yBU7eihC_dtOWIaToNjB4DPDU6Mhcgxd9fjCt5Z5t-cvAg/formResponse',
  kind: 'entry.943265526',
  text: 'entry.377622377',
  nick: 'entry.1662671808',
  agree: 'entry.140036354',
  kindValue: { chat: '어이없는 업무 관련 대화', story: '직장 썰' },
  agreeValue: '동의',
};

export interface Report {
  kind: ReportKind;
  text: string;
  nick: string;
}

export const REPORT_MAX = 1500;

export function reportProblem(r: Report, agreed: boolean): string | null {
  if (r.text.trim().length < 10) return '조금만 더 자세히 적어 주세요 (10자 이상)';
  if (r.text.length > REPORT_MAX) return `${REPORT_MAX}자까지 적을 수 있어요`;
  if (!agreed) return '각색해서 실릴 수 있다는 데 동의해 주세요';
  return null;
}

/** 제보 보내기. 응답 내용은 볼 수 없어서(no-cors) 네트워크 오류만 실패로 본다 */
export async function sendReport(r: Report, form: ReportForm | null = REPORT_FORM, fetcher: typeof fetch = fetch): Promise<boolean> {
  if (!form) {
    await new Promise((ok) => setTimeout(ok, 700));
    return true;
  }
  const body = new URLSearchParams({
    [form.kind]: form.kindValue[r.kind],
    [form.text]: r.text.trim(),
    [form.nick]: r.nick.trim(),
    [form.agree]: form.agreeValue,
  });
  try {
    await fetcher(form.action, { method: 'POST', mode: 'no-cors', body });
    return true;
  } catch {
    return false;
  }
}
