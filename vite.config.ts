import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** 썰 대본(stories.json)과 드래곤 장면 목록(dragon.json)을 사이트에 함께 올린다 (앱은 이 파일들로 새 콘텐츠를 받아온다) */
function storiesFile(): Plugin {
  return {
    name: 'stories-json',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'stories.json', source: readFileSync('src/content/stories.json', 'utf-8') });
      this.emitFile({ type: 'asset', fileName: 'dragon.json', source: readFileSync('src/content/dragon.json', 'utf-8') });
    },
  };
}

export default defineConfig({
  plugins: [react(), storiesFile()],
  base: './',
});
