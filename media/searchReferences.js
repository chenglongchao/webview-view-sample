const fs = require('fs');
const path = require('path');
const findReferences = require('./structure.js'); // 假设这个模块是你用来查找引用的
const blackList = require('./blacklist');

// 执行文件搜索并查找引用。
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

module.exports = { searchReferences };
