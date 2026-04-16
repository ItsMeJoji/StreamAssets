const fs = require('fs');
const path = require('path');

function getHtmlInputs() {
  const files = fs
    .readdirSync(__dirname)
    .filter((file) => file.endsWith('.html'));

  return Object.fromEntries(
    files.map((file) => [path.basename(file, '.html'), path.resolve(__dirname, file)])
  );
}

function copyStaticAssets() {
  const assetsToCopy = ['js', 'images', 'dat'];
  
  assetsToCopy.forEach(folder => {
    const sourceDir = path.resolve(__dirname, 'assets', folder);
    const targetDir = path.resolve(__dirname, 'dist', 'assets', folder);

    if (fs.existsSync(sourceDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      fs.cpSync(sourceDir, targetDir, { recursive: true });
    }
  });
}

module.exports = {
  appType: 'mpa',
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: getHtmlInputs()
    }
  },
  plugins: [
    {
      name: 'copy-static-assets',
      closeBundle() {
        copyStaticAssets();
      }
    }
  ]
};
