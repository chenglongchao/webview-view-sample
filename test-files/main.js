import { add, PI } from "./utils";
import multiply from "./utils";

// 多种使用方式
console.log(add(1, 2));             // 函数调用
console.log("PI is", PI);           // 变量使用
const myAdd = add;                  // 变量赋值
const result = multiply(3, 4);      // 默认导入使用

// 在对象中使用
const mathUtils = {
  addFunc: add,
  piValue: PI,
  multiplyFunc: multiply
};

// 在函数中使用
function calculate() {
  return add(PI, multiply(2, 3));
}

// 条件使用
if (PI > 3) {
  console.log(add(PI, 1));
}