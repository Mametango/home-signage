const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

walk('./src', function (filePath) {
    if (filePath.endsWith('.css')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content.replace(/([ \t]*)backdrop-filter:([^;]+);/g, (match, p1, p2) => {
            if (content.includes(`-webkit-backdrop-filter: ${p2.trim()}`) || content.includes(`-webkit-backdrop-filter:${p2}`)) {
                return match;
            }
            return `${p1}-webkit-backdrop-filter:${p2};\n${p1}backdrop-filter:${p2};`;
        });
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Fixed:', filePath);
        }
    }
});
