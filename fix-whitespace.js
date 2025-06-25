#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File extensions to process
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.md', '.json', '.xml', '.txt'];
const IGNORE_DIRS = ['node_modules', '.git', 'dist', '.next', '.vite', '__pycache__'];

function shouldProcessFile(filePath) {
    const ext = path.extname(filePath);
    return EXTENSIONS.includes(ext);
}

function shouldIgnoreDir(dirName) {
    return IGNORE_DIRS.includes(dirName);
}

function fixWhitespace(content) {
    return content
        // Remove trailing whitespace
        .replace(/[ \t]+$/gm, '')
        // Convert tabs to spaces (2 spaces)
        .replace(/\t/g, '  ')
        // Remove multiple consecutive empty lines (keep max 2)
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        // Ensure consistent line endings
        .replace(/\r\n/g, '\n')
        // Remove BOM if present
        .replace(/^\uFEFF/, '');
}

function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fixedContent = fixWhitespace(content);

        if (content !== fixedContent) {
            fs.writeFileSync(filePath, fixedContent, 'utf8');
            console.log(`✅ Fixed: ${filePath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

function walkDir(dir) {
    let fixedCount = 0;

    try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (!shouldIgnoreDir(item)) {
                    fixedCount += walkDir(fullPath);
                }
            } else if (stat.isFile() && shouldProcessFile(fullPath)) {
                if (processFile(fullPath)) {
                    fixedCount++;
                }
            }
        }
    } catch (error) {
        console.error(`❌ Error reading directory ${dir}:`, error.message);
    }

    return fixedCount;
}

// Main execution
console.log('🧹 Starting whitespace cleanup...\n');

const startTime = Date.now();
const rootDir = path.join(__dirname);
const fixedFiles = walkDir(rootDir);

const endTime = Date.now();
const duration = ((endTime - startTime) / 1000).toFixed(2);

console.log(`\n✨ Whitespace cleanup completed!`);
console.log(`📊 Files fixed: ${fixedFiles}`);
console.log(`⏱️  Duration: ${duration}s`);

if (fixedFiles > 0) {
    console.log('\n💡 Run "git add . && git commit -m \'Fix whitespace issues\'" to commit the changes');
} else {
    console.log('\n🎉 No whitespace issues found!');
}