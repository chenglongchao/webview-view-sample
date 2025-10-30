// 测试路径解析功能
const { resolveImportPath } = require('./out/pathResolver');
const path = require('path');

const workspaceRoot = '/Users/bilibili/Desktop/未命名文件夹/webview-view-sample';
const aliasConfig = {
  '@/': 'src/',
  '~/': 'src/components/'
};

// 测试案例
const testCases = [
  {
    importPath: './components/basic',
    currentFile: '/Users/bilibili/Desktop/未命名文件夹/webview-view-sample/test-files/parent.js',
    description: '相对路径导入，无扩展名'
  },
  {
    importPath: './basic',
    currentFile: '/Users/bilibili/Desktop/未命名文件夹/webview-view-sample/test-files/components/index.js',
    description: '相对路径导入，同目录'
  },
  {
    importPath: '@/components/basic',
    currentFile: '/Users/bilibili/Desktop/未命名文件夹/webview-view-sample/test-files/parent.js',
    description: '别名路径导入'
  }
];

console.log('=== 路径解析测试 ===');
testCases.forEach((testCase, index) => {
  console.log(`\n测试 ${index + 1}: ${testCase.description}`);
  console.log(`导入路径: ${testCase.importPath}`);
  console.log(`当前文件: ${testCase.currentFile}`);
  
  const result = resolveImportPath(
    testCase.importPath,
    testCase.currentFile,
    aliasConfig,
    workspaceRoot
  );
  
  console.log(`解析结果: ${result || '未找到'}`);
  console.log('---');
});