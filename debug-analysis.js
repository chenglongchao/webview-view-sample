// 让我们创建一个更明确的测试来验证区别

console.log('=== 🧐 深入分析问题 ===\n');

console.log('让我们用一个非常简单的例子来测试：\n');

console.log('📄 utils.js (被引用的文件):');
console.log('```javascript');
console.log('export function add(a, b) {');
console.log('  return a + b;');
console.log('}');
console.log('export const PI = 3.14;');
console.log('```\n');

console.log('📄 main.js (引用文件):');
console.log('```javascript');
console.log('import { add, PI } from "./utils";  // <- 这是import语句');
console.log('');
console.log('console.log(add(1, 2));             // <- 这是函数调用');
console.log('console.log("PI is", PI);           // <- 这是变量使用');
console.log('const myAdd = add;                  // <- 这是变量赋值');
console.log('```\n');

console.log('=== 预期结果对比 ===');
console.log('');
console.log('🔄 反向查找文件引用 (我们的扩展):');
console.log('对 utils.js 文件执行 -> 只找到:');
console.log('  main.js:1  import { add, PI } from "./utils"');
console.log('');
console.log('🔍 查找引用 (VS Code内置):');
console.log('对 utils.js 中的 add 函数执行 -> 应该找到:');
console.log('  main.js:1  import { add, PI } from "./utils"');
console.log('  main.js:3  console.log(add(1, 2))');
console.log('  main.js:5  const myAdd = add');
console.log('');
console.log('如果这两个结果还是一样，那确实有问题！');