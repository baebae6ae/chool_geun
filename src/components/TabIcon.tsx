/** 하단 탭·화면 제목에 쓰는 손그림 아이콘 (이모지 대신 — 기기마다 모양이 달라 서식지 그림과 따로 놀았다) */
export type IconId = 'home' | 'office' | 'dex' | 'records' | 'custom' | 'settings';

const LINE = '#8b5e3c';

export function TabIcon({ id, className = '' }: { id: IconId; className?: string }) {
  return (
    <svg
      className={`draw-icon ${className}`}
      viewBox="0 0 32 32"
      fill="none"
      stroke={LINE}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {id === 'home' && (
        <g>
          <circle cx="8.5" cy="8" r="3.6" fill="#c89268" />
          <circle cx="23.5" cy="8" r="3.6" fill="#c89268" />
          <path d="M16 6.2c6.6 0 11 4 11 10 0 6.4-4.6 10-11 10S5 22.6 5 16.2c0-6 4.4-10 11-10Z" fill="#ffcf9c" />
          <ellipse cx="16" cy="19" rx="4.6" ry="3.4" fill="#fff4e2" stroke="none" />
          <circle cx="11.4" cy="15" r="1.3" fill={LINE} stroke="none" />
          <circle cx="20.6" cy="15" r="1.3" fill={LINE} stroke="none" />
          <ellipse cx="16" cy="17.6" rx="1.4" ry="1" fill="#f48f98" stroke="none" />
          <ellipse cx="8.8" cy="18.6" rx="2" ry="1.3" fill="#ffb3b8" stroke="none" />
          <ellipse cx="23.2" cy="18.6" rx="2" ry="1.3" fill="#ffb3b8" stroke="none" />
        </g>
      )}
      {id === 'office' && (
        <g>
          <rect x="6" y="6" width="20" height="21" rx="2.4" fill="#cfe3f6" />
          <path d="M6 12h20" />
          <rect x="9.5" y="14.5" width="3.6" height="3.4" rx=".8" fill="#fff0b0" />
          <rect x="14.2" y="14.5" width="3.6" height="3.4" rx=".8" fill="#fff0b0" />
          <rect x="18.9" y="14.5" width="3.6" height="3.4" rx=".8" fill="#fff0b0" />
          <rect x="9.5" y="19.4" width="3.6" height="3.4" rx=".8" fill="#fff0b0" />
          <rect x="18.9" y="19.4" width="3.6" height="3.4" rx=".8" fill="#fff0b0" />
          <path d="M14 27v-5.2h4V27" fill="#f2b88a" />
          <path d="M4.5 27.5h23" />
        </g>
      )}
      {id === 'dex' && (
        <g>
          <path d="M4.5 8.5c4-1.6 8-1.2 11.5 1.2v17c-3.5-2.2-7.5-2.6-11.5-1Z" fill="#fff6dc" />
          <path d="M27.5 8.5c-4-1.6-8-1.2-11.5 1.2v17c3.5-2.2 7.5-2.6 11.5-1Z" fill="#fff6dc" />
          <path d="M7.5 12.4c2-.5 4-.4 5.6.4M7.5 16.2c2-.5 4-.4 5.6.4M24.5 12.4c-2-.5-4-.4-5.6.4M24.5 16.2c-2-.5-4-.4-5.6.4" stroke="#d9b98a" strokeWidth="1.3" />
          <path d="M16 9.7v17" />
          <path d="M22 4.6l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3Z" fill="#ffd54a" strokeWidth="1.2" />
        </g>
      )}
      {id === 'records' && (
        <g>
          <rect x="7" y="4.5" width="19" height="23" rx="2.6" fill="#ffd98a" />
          <path d="M12 9.5h10M12 14h10M12 18.5h7" stroke="#c99a4a" strokeWidth="1.4" />
          <path d="M7 8.5h-2.2M7 13h-2.2M7 17.5h-2.2M7 22h-2.2" />
          <path d="M23.5 20l4.2-4.2 2.2 2.2-4.2 4.2-3 .8Z" fill="#ffb3a0" />
        </g>
      )}
      {id === 'custom' && (
        <g>
          <path d="M16 15.5C12 9 6.5 8.5 5 10.8c-1.4 2.4 1.2 8.4 8.2 6.2Z" fill="#ffb3c4" />
          <path d="M16 15.5C20 9 25.5 8.5 27 10.8c1.4 2.4-1.2 8.4-8.2 6.2Z" fill="#ffb3c4" />
          <path d="M14.2 18.4 11 26.5l3-1.6 2 2.6 1-8.2ZM17.8 18.4 21 26.5l-3-1.6" fill="#ff93ab" />
          <circle cx="16" cy="15.8" r="3" fill="#ff7c9a" />
        </g>
      )}
      {id === 'settings' && (
        <g>
          <path
            d="M16 4.5l2 .3.7 2.6 2.1 1 2.5-1.1 2.2 2.2-1.1 2.5 1 2.1 2.6.7.3 2-.3 2-2.6.7-1 2.1 1.1 2.5-2.2 2.2-2.5-1.1-2.1 1-.7 2.6-2 .3-2-.3-.7-2.6-2.1-1-2.5 1.1-2.2-2.2 1.1-2.5-1-2.1-2.6-.7L4.5 16l.3-2 2.6-.7 1-2.1-1.1-2.5 2.2-2.2 2.5 1.1 2.1-1 .7-2.6Z"
            fill="#e6cfa9"
            transform="translate(0 0) scale(.92) translate(1.4 1.4)"
          />
          <circle cx="16" cy="16" r="4" fill="#fff6dc" />
        </g>
      )}
    </svg>
  );
}
