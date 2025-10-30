// 模拟扩展的实际行为测试
const path = require('path');

// 导入编译后的模块
async function testExtensionBehavior() {
  // 模拟扩展中的调用
  const { resolveImportPath } = require('./out/pathResolver');
  const fs = require('fs').promises;

  const workspaceRoot = '/Users/bilibili/Desktop/未命名文件夹/webview-view-sample';
  const targetFilePath = '/Users/bilibili/Desktop/未命名文件夹/webview-view-sample/test-files/components/basic.js'; // 完整路径
  const aliasConfig = {
    '@/': 'src/',
    '~/': 'src/components/'
  };

  console.log('=== 模拟扩展行为测试 ===');
  console.log(`目标文件路径: ${targetFilePath}`);
  console.log(`工作空间: ${workspaceRoot}`);
  console.log('');

  const references = [];
  const validExtensions = ['.ts', '.js', '.tsx', '.jsx'];
  const targetFileAbsolutePath = path.resolve(targetFilePath);
  
  console.log(`目标文件绝对路径: ${targetFileAbsolutePath}`);

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
      
      console.log(`[Extension] 搜索文件: ${filePath}`);
      
      lines.forEach((line, index) => {
        // 搜索 import 语句
        const importMatch = line.match(/import.*from\s+['"`]([^'"`]+)['"`]/);
        if (importMatch) {
          const importPath = importMatch[1];
          console.log(`[Extension] 找到import: ${importPath} 在文件 ${filePath} 第 ${index + 1} 行`);
          
          const resolvedImportPath = resolveImportPath(importPath, filePath, aliasConfig, workspaceRoot);
          console.log(`[Extension] 解析后的import路径: ${resolvedImportPath}`);
          console.log(`[Extension] 比较路径: ${resolvedImportPath && path.resolve(resolvedImportPath)} vs ${targetFileAbsolutePath}`);
          
          if (resolvedImportPath && path.resolve(resolvedImportPath) === targetFileAbsolutePath) {
            console.log(`[Extension] ✅ 匹配成功！${importPath} 引用了目标文件`);
            references.push({
              file: path.relative(workspaceRoot, filePath),
              line: index + 1,
              format: 'import',
              content: line.trim(),
              path: `${filePath}#${index + 1}`
            });
          } else {
            console.log(`[Extension] ❌ 路径不匹配`);
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
testExtensionBehavior().catch(console.error);