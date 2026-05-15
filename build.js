const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Files to include in the build
const filesToCopy = [
    'index.html', 
    'styles.css', 
    'script.js', 
    'server.js', 
    'package.json'
];

console.log('Building project...');

// Copy each file to the dist directory
filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(path.join(__dirname, file), path.join(distDir, file));
        console.log(`✅ Copied ${file} to dist/`);
    } else {
        console.warn(`⚠️ Warning: ${file} not found`);
    }
});

console.log('\n🎉 Build completed successfully! Your files are ready in the "dist" folder.');
