const fs = require('fs');
const path = require('path');
const findReferences = require('./structure.js');
const blackList = require('./blacklist.js')

// 根据文件夹，来筛选所有引用
module.exports = function readDirectory(directoryPath) {
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
