const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.html')) {
    const filepath = path.join(dir, file);
    let content = fs.readFileSync(filepath, 'utf8');
    
    // The snippet to remove
    const snippetRegex = /\s*\/\/\s*Mobile dropdown\s*document\.querySelectorAll\("\.dropdown > a"\)\.forEach\(\(link\) => \{[\s\S]*?\}\);\s*\}\);\s*\}\);/g;
    
    if (snippetRegex.test(content)) {
      console.log(`Fixing ${file}`);
      content = content.replace(snippetRegex, '');
      fs.writeFileSync(filepath, content, 'utf8');
    }
  }
}
