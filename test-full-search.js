// 测试完整的反向查找功能
const path = require('path');

// 模拟扩展的核心函数
async function testFindFileReferences() {
  // 首先需要导入编译后的扩展模块
  const { resolveImportPath } = require('./out/pathResolver');
  const fs = require('fs').promises;

  const workspaceRoot = '/Users/bilibili/Desktop/未命名文件夹/webview-view-sample';
  const targetFile = '/Users/bilibili/Desktop/未命名文件夹/webview-view-sample/test-files/components/basic.js';
  const aliasConfig = {
    '@/': 'src/',
    '~/': 'src/components/'
  };

  console.log('=== 完整反向查找测试 ===');
  console.log(`目标文件: ${targetFile}`);
  console.log(`工作空间: ${workspaceRoot}`);
  console.log('');

  const references = [];
  const validExtensions = ['.ts', '.js', '.tsx', '.jsx'];

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
          
          if (resolvedImportPath && path.resolve(resolvedImportPath) === path.resolve(targetFile)) {
            console.log(`✅ 找到引用!`);
            console.log(`  文件: ${path.relative(workspaceRoot, filePath)}`);
            console.log(`  行号: ${index + 1}`);
            console.log(`  内容: ${line.trim()}`);
            console.log(`  导入路径: ${importPath}`);
            console.log(`  解析后路径: ${resolvedImportPath}`);
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
        
        // 搜索 require 语句
        const requireMatch = line.match(/require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/);
        if (requireMatch) {
          const requirePath = requireMatch[1];
          
          const resolvedRequirePath = resolveImportPath(requirePath, filePath, aliasConfig, workspaceRoot);
          
          if (resolvedRequirePath && path.resolve(resolvedRequirePath) === path.resolve(targetFile)) {
            console.log(`✅ 找到require引用!`);
            console.log(`  文件: ${path.relative(workspaceRoot, filePath)}`);
            console.log(`  行号: ${index + 1}`);
            console.log(`  内容: ${line.trim()}`);
            console.log(`  require路径: ${requirePath}`);
            console.log(`  解析后路径: ${resolvedRequirePath}`);
            console.log('');
            
            references.push({
              file: path.relative(workspaceRoot, filePath),
              line: index + 1,
              format: 'require',
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
  
  console.log(`=== 搜索完成 ===`);
  console.log(`总共找到 ${references.length} 个引用`);
  
  return references;
}

// 运行测试
testFindFileReferences().catch(console.error);