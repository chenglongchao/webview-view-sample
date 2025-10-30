// 测试 utils.js 的反向查找
const path = require('path');

async function testUtilsReferences() {
  const { resolveImportPath } = require('./out/pathResolver');
  const fs = require('fs').promises;

  const workspaceRoot = '/Users/bilibili/Desktop/未命名文件夹/webview-view-sample';
  const targetFile = '/Users/bilibili/Desktop/未命名文件夹/webview-view-sample/test-files/utils.js';
  const aliasConfig = {};

  console.log('=== 🧪 测试 utils.js 的反向查找 ===');
  console.log(`目标文件: ${path.relative(workspaceRoot, targetFile)}`);
  console.log('');

  const references = [];
  const validExtensions = ['.ts', '.js', '.tsx', '.jsx'];
  const targetFileAbsolutePath = path.resolve(targetFile);

  async function searchDirectory(directory) {
    try {
      const files = await fs.readdir(directory);
      
      for (const file of files) {
        if (file.startsWith('.') || ['node_modules', '.git', 'out', 'dist'].includes(file)) {
          continue;
        }
        
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isDirectory()) {
          await searchDirectory(filePath);
        } else if (validExtensions.includes(path.extname(filePath))) {
          await searchFileForReferences(filePath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${directory}:`, error);
    }
  }

  async function searchFileForReferences(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // 搜索 import 语句
        const importMatch = line.match(/import.*from\s+['"`]([^'"`]+)['"`]/);
        if (importMatch) {
          const importPath = importMatch[1];
          
          const resolvedImportPath = resolveImportPath(importPath, filePath, aliasConfig, workspaceRoot);
          
          if (resolvedImportPath && path.resolve(resolvedImportPath) === targetFileAbsolutePath) {
            console.log(`✅ 找到引用:`);
            console.log(`  文件: ${path.relative(workspaceRoot, filePath)}`);
            console.log(`  行号: ${index + 1}`);
            console.log(`  内容: ${line.trim()}`);
            console.log('');
            
            references.push({
              file: path.relative(workspaceRoot, filePath),
              line: index + 1,
              format: 'import',
              content: line.trim(),
              path: `${filePath}#${index + 1}`
            });
          }
        }
      });
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  }

  await searchDirectory(path.join(workspaceRoot, 'test-files'));
  
  console.log(`=== 结果 ===`);
  console.log(`我们的扩展找到 ${references.length} 个文件级引用`);
  console.log('');
  console.log('现在请在VS Code中:');
  console.log('1. 打开 test-files/utils.js');
  console.log('2. 选中第1行的 "add" 函数名');
  console.log('3. 按 Shift+F12 查看VS Code的引用结果');
  console.log('');
  console.log('VS Code应该找到更多结果，包括:');
  console.log('- main.js 中的所有 add() 函数调用');
  console.log('- main.js 中的所有 PI 变量使用');
  console.log('- main.js 中的所有 multiply() 函数调用');
  
  return references;
}

testUtilsReferences().catch(console.error);