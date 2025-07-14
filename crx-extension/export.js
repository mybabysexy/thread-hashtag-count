import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current directory with ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const sourceDir = __dirname; // Current directory
const targetDir = path.join(__dirname, 'extension'); // Export directory
const filesToCopy = [
  'background.js',
  'foreground.js',
  'index.html',
  'manifest.json'
];
const foldersToCopy = [
  'logo',
  'sidebar'
];

// Create export function
function exportExtension() {
  console.log('Starting export process...');

  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`Created directory: ${targetDir}`);
  } else {
    // Clean existing directory
    console.log('Cleaning target directory...');
    try {
      execSync(`rm -rf ${targetDir}/*`);
    } catch (error) {
      // For Windows compatibility
      fs.readdirSync(targetDir).forEach(file => {
        const curPath = path.join(targetDir, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          fs.rmSync(curPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(curPath);
        }
      });
    }
  }

  // Copy individual files
  filesToCopy.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied file: ${file}`);
    } else {
      console.warn(`Warning: File not found: ${sourcePath}`);
    }
  });

  // Copy folders
  foldersToCopy.forEach(folder => {
    const sourcePath = path.join(sourceDir, folder);
    const targetPath = path.join(targetDir, folder);

    if (fs.existsSync(sourcePath)) {
      copyFolderRecursive(sourcePath, targetPath);
      console.log(`Copied folder: ${folder}`);
    } else {
      console.warn(`Warning: Folder not found: ${sourcePath}`);
    }
  });

  console.log('Export completed successfully!');
}

// Helper function to copy folders recursively
function copyFolderRecursive(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);

    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyFolderRecursive(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

// Execute the export
exportExtension();
