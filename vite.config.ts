import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** 썰 대본을 사이트에 stories.json으로 함께 올린다 (앱은 이 파일로 새 썰을 받아온다) */
function storiesFile(): Plugin {
  return {
    name: 'stories-json',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'stories.json', source: readFileSync('src/content/stories.json', 'utf-8') });
    },
  };
}

export default defineConfig({
  plugins: [react(), storiesFile()],
  base: './',
});
