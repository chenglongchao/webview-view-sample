
const fs = require('fs');
const jscodeshift = require('jscodeshift');
const path = require('path');
module.exports = function reverseFindFileReferences(targetFileName, directory = '.') {
    const references = [];

    const jsconfigPath = 'jsconfig.json';
    const paths = readJsConfig(jsconfigPath);

    // if (!fs.lstatSync(directory).isDirectory()) {
    //     console.error('您输入的不是文件夹');
    //     return references;
    // }

    // const validExtensions = validateFile(targetFileName);
    // if (!validExtensions) {
    //     console.error('请提供有效的文件名，文件扩展名应为 .ts, .js, .tsx, 或 .jsx');
    //     return references;
    // }

    // targetFileName = targetFileName.replace(/\.[^/.]+$/, ""); // 去除文件扩展名

    // references.push(...searchReferences(directory, targetFileName, jsconfigPath, paths));

    return references;
}

const blackList = [
    'node_modules',
];

function readDirectory(directoryPath) {
    if (!directoryPath) {
        directoryPath = __dirname; // 如果未传入directoryPath参数，则默认使用当前模块的目录路径
    }

    const files = fs.readdirSync(directoryPath);
    const allFilesReferences = {};
    // 过滤掉带.前缀的属性和node_modules属性
    const filteredData = files.filter(item => !item.startsWith('.') && !blackList.includes(item))
        .filter(item => {
            const filePath = path.join(directory, item);
            const stats = fs.statSync(filePath);
            return stats.isDirectory() || /\.(js|jsx|ts|tsx)$/.test(path.extname(filePath));
        });

    filteredData.forEach(file => {
        const filePath = path.join(directoryPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
            const references = findReferences(filePath);
            allFilesReferences[path.basename(filePath)] = references;
        } else if (stats.isDirectory()) {
            allFilesReferences[path.basename(filePath)] = readDirectory(filePath); // 递归读取子目录中的文件
        }
    });

    return allFilesReferences;
}

function readJsConfig(jsconfigPath) {
	if (fs.existsSync(jsconfigPath)) {
		const jsconfigContent = fs.readFileSync(jsconfigPath, 'utf8');
		const jsconfig = JSON.parse(jsconfigContent);
		return jsconfig?.compilerOptions?.paths || {};
	}
	return {};
}

function reversefindFileReferences(targetFileName, directory = '.') {
    const references = [];
    const jsconfigPath = 'jsconfig.json'; // 替换为你的jsconfig.json文件路径

    // 如果存在jsconfig.json文件，则读取其内容
    let paths = {};
    if (fs.existsSync(jsconfigPath)) {
        const jsconfigContent = fs.readFileSync(jsconfigPath, 'utf8');
        const jsconfig = JSON.parse(jsconfigContent);
        paths = jsconfig?.compilerOptions?.paths;
    }

    // 检查传入的directory是否是文件夹
    if (!fs.lstatSync(directory).isDirectory()) {
        console.error('您输入的不是文件夹');
        return references;
    }

    // 检查targetFileName的文件扩展名
    const validExtensions = ['.ts', '.js', '.tsx', '.jsx'];
    const fileExtension = path.extname(targetFileName);
    if (!validExtensions.includes(fileExtension)) {
        console.error('请提供有效的文件名，文件扩展名应为 .ts, .js, .tsx, 或 .jsx');
        return references;
    }

    function searchReferences(directory, targetFileName) {
        const files = fs.readdirSync(directory)
            .filter(item => !item.startsWith('.') && !blackList.includes(item))
            .filter(item => {
                const filePath = path.join(directory, item);
                const stats = fs.statSync(filePath);
                return stats.isDirectory() || /\.(js|jsx|ts|tsx)$/.test(path.extname(filePath));
            });

        files.forEach(file => {
            const filePath = path.join(directory, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
                const fileReferences = findReferences(filePath);
                const fileData = fileReferences.filter(reference => {
                    const extension = path.extname(reference.path);
                    return !['.less', '.css', '.sass'].includes(extension);
                });
                fileData.forEach(reference => {
                    let importPath = reference.path;
                    if (fs.existsSync(jsconfigPath) && paths) {
                        // 统一别名格式并去除通配符 *
                        const normalizedPaths = {};
                        for (const key in paths) {
                            const normalizedKey = key.replace('@/*', '@/').replace('#/*', '#/');
                            const normalizedValue = paths[key][0].replace('*', '').replace('./','');
                            normalizedPaths[normalizedKey] = [normalizedValue];
                        }
                        // 动态替换 importPath 中的别名
                        for (const aliasKey in normalizedPaths) {
                            if (importPath.includes(aliasKey)) {
                                const alias = aliasKey;
                                const aliasValue = normalizedPaths[aliasKey][0];
                                importPath = importPath.replace(alias, aliasValue);
                            }
                        }
                    }
                    if(importPath.includes('./')){
                        importPath = importPath.replace('./','')
                    }
                    if (importPath.includes(targetFileName)) {
                        references.push({ 
                            file: filePath, 
                            line: reference.line, 
                            format: reference.format, 
                            column: reference.column,
                            path: `${filePath}#${reference.line},${reference.column}`
                        });
                    }
                });
            } else if (stats.isDirectory()) {
                searchReferences(filePath, targetFileName); // 递归搜索子目录
            }
        });
    }

    // 去除文件扩展名
    targetFileName = targetFileName.replace(/\.[^/.]+$/, "");

    searchReferences(directory, targetFileName);
    return references;
}

function searchReferences(directory, targetFileName, jsconfigPath, paths) {
    const references = [];

    function recurse(dir) {
        const files = fs.readdirSync(dir)
            .filter(item => !item.startsWith('.') && !blackList.includes(item))
            .filter(item => {
                const filePath = path.join(dir, item);
                const stats = fs.statSync(filePath);
                return stats.isDirectory() || /\.(js|jsx|ts|tsx)$/.test(path.extname(filePath));
            });

        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
                const fileReferences = findReferences(filePath);
                processFileReferences(fileReferences, filePath, targetFileName,jsconfigPath, paths, references);
            } else if (stats.isDirectory()) {
                recurse(filePath); // 递归搜索子目录
            }
        });
    }

    recurse(directory);
    return references;
}

function processFileReferences(fileReferences, filePath, targetFileName,jsconfigPath, paths, references) {
    const fileData = fileReferences.filter(reference => {
        const extension = path.extname(reference.path);
        return !['.less', '.css', '.sass'].includes(extension);
    });
    fileData.forEach(reference => {
        let importPath = reference.path;
        if (fs.existsSync(jsconfigPath) && paths) {
            // 统一别名格式并去除通配符 *
            const normalizedPaths = {};
            for (const key in paths) {
                const normalizedKey = key.replace('@/*', '@/').replace('#/*', '#/');
                const normalizedValue = paths[key][0].replace('*', '').replace('./','');
                normalizedPaths[normalizedKey] = [normalizedValue];
            }
            // 动态替换 importPath 中的别名
            for (const aliasKey in normalizedPaths) {
                if (importPath.includes(aliasKey)) {
                    const alias = aliasKey;
                    const aliasValue = normalizedPaths[aliasKey][0];
                    importPath = importPath.replace(alias, aliasValue);
                }
            }
        }
        if(importPath.includes('./')){
            importPath = importPath.replace('./','')
        }
        if (importPath.includes(targetFileName)) {
            references.push({ 
                file: filePath, 
                line: reference.line, 
                format: reference.format, 
                column: reference.column,
                path: `${filePath}#${reference.line},${reference.column}`
            });
        }
    });
}

function findReferences(filePath) {
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

// 验证目标文件名。
function validateFile(targetFileName) {
	const validExtensions = ['.ts', '.js', '.tsx', '.jsx'];
	const fileExtension = path.extname(targetFileName);
	return validExtensions.includes(fileExtension);
}