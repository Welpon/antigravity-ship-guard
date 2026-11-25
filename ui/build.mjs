import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');

const result = await esbuild.build({
  entryPoints: [path.join(__dirname, 'app.js')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  minify: true,
  write: false,
});

const js = result.outputFiles[0].text;

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ship Guard</title>
  <style>${css}</style>
</head>
<body>
  <div id="root"></div>
  <script type="module">${js}</script>
</body>
</html>
`;

const outPath = path.join(ROOT, 'server', 'app.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log(`Built ${outPath} (${Buffer.byteLength(html, 'utf8')} bytes)`);
