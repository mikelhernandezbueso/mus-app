// Convierte dist-artifact/index.html en el cuerpo de página que espera un Artifact de claude.ai.
const fs = require('fs');
let html = fs.readFileSync('dist-artifact/index.html', 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
const keep = head
  .split(/\n/)
  .filter((l) => !/<meta charset|name="viewport"|rel="icon"|apple-touch-icon|apple-mobile|mobile-web-app|manifest/.test(l))
  .join('\n');
fs.writeFileSync('dist-artifact/mus-eskola.html', keep.trim() + '\n' + body.trim() + '\n');
console.log('ok', (fs.statSync('dist-artifact/mus-eskola.html').size / 1024).toFixed(0), 'KB');
