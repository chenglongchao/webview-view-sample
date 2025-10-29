const jscodeshift = require('jscodeshift');
const fs = require('fs');
const path = require('path');

// 正向查找 并传入文件路径(相对路径) 仅支持js、ts、jsx、tsx文件查找
module.exports = function findReferences(filePath) {
  const jsconfigPath = 'jsconfig.json';

  const source = fs.readFileSync(filePath, 'utf-8');
  const ast = jscodeshift(source);

  let paths = {};
  if (fs.existsSync(jsconfigPath)) {
    const jsconfigContent = fs.readFileSync(jsconfigPath, 'utf8');
    const jsconfig = JSON.parse(jsconfigContent);
    paths = jsconfig.compilerOptions.paths;
  }

  const references = ast.find(jscodeshift.ImportDeclaration, {
    source: {
      type: 'Literal',
    },
  }).nodes();

  const requireReferences = ast.find(jscodeshift.VariableDeclarator, {
    init: {
      type: 'CallExpression',
      callee: {
        name: 'require',
      },
    },
  }).nodes();

  const allReferences = [];

  references.forEach(reference => {
    let importPath = reference.source.value;
    const resolvedImportPath = path.resolve(path.dirname(filePath), importPath);
    if (fs.existsSync(jsconfigPath) && importPath.includes('@/')) {
      const aliasKey = Object.keys(paths)[0]; // 获取@/*的键名
      const alias = aliasKey.replace('/*', '');
      const aliasValue = paths[aliasKey][0]; // 获取@/*的值
      const resolvedAliasValue = aliasValue.replace('./', '').replace('/*', '');
      importPath = importPath.replace(alias, resolvedAliasValue);
    }
    allReferences.push({ path: resolvedImportPath, line: reference.loc.start.line, format: 'import', column: reference.loc.start.column });
  });

  requireReferences.forEach(reference => {
    const importPath = reference.init.arguments[0].value;
    const resolvedImportPath = path.resolve(path.dirname(filePath), importPath);
    allReferences.push({ path: resolvedImportPath, line: reference.loc.start.line, format: 'require', column: reference.loc.start.column });
  });

  return allReferences
}


