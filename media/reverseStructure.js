const fs = require('fs');
const path = require('path');
const findReferences = require('./structure.js');
const blackList = require('./blacklist.js'); // 假设这里引入了黑名单数据

module.exports = function reversefindFileReferences(targetFileName, directory = '.') {
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
