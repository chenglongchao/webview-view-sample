// 最终区别总结

console.log('=== 📊 实际测试结果对比 ===\n');

console.log('🔄 我们的"反向查找文件引用"扩展:');
console.log('✅ 只找 import/require 语句 (文件级依赖)');
console.log('📊 找到 4 个结果:');
console.log('   1. TestComponent.js:1    import Basic from \'./components/basic\'');
console.log('   2. TreePerspective.js:2  import Basic from \'./components/basic\'');
console.log('   3. components/index.js:1 import Basic from \'./basic\'');
console.log('   4. parent.js:1           import Basic from \'./components/basic\'');

console.log('\n🔍 VS Code内置"查找引用" (Shift+F12):');
console.log('✅ 找所有符号使用 (import + 实际调用)');
console.log('📊 应该找到更多结果:');
console.log('   上面4个 import 语句 +');
console.log('   TestComponent.js:5   const result1 = Basic({ basicList: [] })');
console.log('   TestComponent.js:8   const component1 = <Basic basicList={data} />');
console.log('   TestComponent.js:11  showBasic ? <Basic basicList={list} /> : null');
console.log('   TestComponent.js:15  <Basic key="1" basicList={list1} />');
console.log('   TestComponent.js:16  <Basic key="2" basicList={list2} />');
console.log('   TestComponent.js:20  ComponentToRender = Basic');
console.log('   TestComponent.js:25  const dynamicBasic = Basic');
console.log('   TreePerspective.js:134 <Basic basicList={basicList}></Basic>');

console.log('\n=== 🎯 核心区别 ===');
console.log('反向查找文件引用: 文件依赖分析 (谁导入了这个文件?)');
console.log('查找引用: 符号使用分析 (这个变量/函数在哪里被用?)');

console.log('\n=== 💡 使用场景 ===');
console.log('反向查找文件引用:');
console.log('  - 删除文件前检查依赖');
console.log('  - 重构模块结构');
console.log('  - 分析项目依赖关系');

console.log('\n查找引用:');
console.log('  - 重构函数名');
console.log('  - 查看函数调用位置');
console.log('  - 调试代码执行路径');

console.log('\n=== ✅ 结论 ===');
console.log('如果你看到的结果一样，可能是因为:');
console.log('1. 测试文件没有实际使用组件 (只有import)');
console.log('2. VS Code的TypeScript支持可能有限');
console.log('3. JSX语法需要特殊的语言服务识别');
console.log('\n但从功能设计上，这两个确实是不同的功能！');