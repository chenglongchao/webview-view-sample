// 另一个引用example.js的文件
const { testFunction } = require('./example.js');

function anotherFunction() {
  return testFunction();
}