import { describe, expect, it } from 'vitest';
import { reportProblem, sendReport, type ReportForm } from './report';
import { isSupporter, recordSupport, TIERS } from './support';
import type { AppState } from './types';

describe('제보', () => {
  const r = { kind: 'chat' as const, text: '팀장님이 퇴근 5분 전에 보고서를 다시 하래요', nick: '김대리' };

  it('너무 짧거나 동의하지 않으면 보내지 않는다', () => {
    expect(reportProblem({ ...r, text: '짧음' }, true)).toMatch(/10자/);
    expect(reportProblem(r, false)).toMatch(/동의/);
    expect(reportProblem(r, true)).toBeNull();
  });

  it('Google 폼 항목에 맞춰 보낸다', async () => {
    const form: ReportForm = {
      action: 'https://docs.google.com/forms/d/e/X/formResponse',
      kind: 'entry.1',
      text: 'entry.2',
      nick: 'entry.3',
      agree: 'entry.4',
      kindValue: { chat: '어이없는 업무 대화', story: '직장 썰' },
      agreeValue: '동의합니다',
    };
    let sent: { url: string; body: URLSearchParams } | null = null;
    const fetcher = (async (url: string, init: RequestInit) => {
      sent = { url, body: init.body as URLSearchParams };
      return new Response();
    }) as unknown as typeof fetch;
    expect(await sendReport(r, form, fetcher)).toBe(true);
    expect(sent!.url).toBe(form.action);
    expect(sent!.body.get('entry.1')).toBe('어이없는 업무 대화');
    expect(sent!.body.get('entry.2')).toBe(r.text);
    expect(sent!.body.get('entry.3')).toBe('김대리');
    expect(sent!.body.get('entry.4')).toBe('동의합니다');
  });

  it('인터넷이 끊기면 실패로 알려 준다', async () => {
    const fail = (async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    const form = { action: 'x', kind: 'a', text: 'b', nick: 'c', agree: 'd', kindValue: { chat: 'c', story: 's' }, agreeValue: 'y' };
    expect(await sendReport(r, form, fail)).toBe(false);
  });
});

describe('응원', () => {
  it('응원할 때마다 횟수가 늘고, 처음 응원한 시각은 그대로', () => {
    let s = { support: undefined } as unknown as AppState;
    expect(isSupporter(s)).toBe(false);
    s = recordSupport(s, 100);
    s = recordSupport(s, 200);
    expect(s.support).toEqual({ count: 2, first: 100, last: 200 });
    expect(isSupporter(s)).toBe(true);
  });

  it('응원 상품은 서로 다른 ID 3개', () => {
    expect(new Set(TIERS.map((t) => t.id)).size).toBe(3);
  });
});
