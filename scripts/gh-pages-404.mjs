/**
 * GitHub Pages отдаёт 404 для вложенных путей SPA; дублируем index → 404.html.
 */
import { copyFileSync } from 'node:fs';

copyFileSync('dist/index.html', 'dist/404.html');
