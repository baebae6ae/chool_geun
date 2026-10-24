import { Component, type ErrorInfo, type ReactNode } from 'react';
import { saveBackup } from '../backup';
import { ContactLink } from './ContactLink';

interface State {
  failed: boolean;
  msg: string | null;
  /** 문의 메일에 붙일 오류 내용 */
  error?: string;
}

/**
 * 화면을 그리다 오류가 나도 하얀 화면으로 멈추지 않게 한다.
 * 기록은 그대로 두고, 다시 시도하거나 백업 파일로 저장해 둘 수 있게 안내한다.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false, msg: null };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { failed: true, error: String(error instanceof Error ? `${error.name}: ${error.message}` : error).slice(0, 300) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('app crashed', error, info.componentStack);
  }

  private backup = async () => {
    try {
      const ok = await saveBackup();
      if (ok) this.setState({ msg: '백업 파일을 저장했어요. 기록은 안전해요.' });
    } catch {
      this.setState({ msg: '백업을 저장하지 못했어요.' });
    }
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="app">
        <main className="content">
          <div className="screen" role="alert" style={{ textAlign: 'center', paddingTop: '18vh' }}>
            <div style={{ fontSize: '3rem' }} aria-hidden>
              🐹💦
            </div>
            <h2>앗, 햄스터가 잠깐 길을 잃었어요</h2>
            <p className="muted">
              화면을 그리다 문제가 생겼어요. 기록은 지워지지 않았어요.
              <br />
              다시 시도해도 같으면 백업을 저장해 두고 문의해 주세요.
            </p>
            <div className="chip-row" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn primary" onClick={() => this.setState({ failed: false, msg: null })}>
                다시 시도
              </button>
              <button type="button" className="btn" onClick={() => location.reload()}>
                새로고침
              </button>
              <button type="button" className="btn" onClick={this.backup}>
                📤 백업
              </button>
            </div>
            {this.state.msg && (
              <p className="muted small" role="status">
                {this.state.msg}
              </p>
            )}
            <p className="muted small">
              <ContactLink error={this.state.error}>문의·제안 (오류 내용이 함께 첨부돼요)</ContactLink>
            </p>
          </div>
        </main>
      </div>
    );
  }
}
