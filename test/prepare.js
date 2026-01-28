const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '../index.html');
const outputJsPath = path.join(__dirname, 'unit/app_logic.js');

try {
    const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
    const match = htmlContent.match(/<script type="module">([\s\S]*?)<\/script>/);
    
    if (match && match[1]) {
        let jsContent = match[1];
        
        // Ensure we don't break on missing DOM elements during test setup
        // We will mock these in the test environment, but just in case
        
        // Append exports for testing
        jsContent += '\nexport { calculate, CONST, SEASON_WEIGHTS };';

        fs.mkdirSync(path.dirname(outputJsPath), { recursive: true });
        fs.writeFileSync(outputJsPath, jsContent);
        console.log('Successfully extracted embedded JS to ' + outputJsPath);
    } else {
        console.error('Could not find <script type="module"> block in index.html');
        process.exit(1);
    }
} catch (err) {
    console.error('Error preparing test file:', err);
    process.exit(1);
}
