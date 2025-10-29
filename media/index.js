const { readJsConfig } = require('./readJsConfig');
const { searchReferences } = require('./searchReferences');
const { validateFile } = require('./validateFile');
const fs = require('fs');

// 反向查找，(相对路径) 仅支持js、ts、jsx、tsx文件查找
module.exports = function reverseFindFileReferences(targetFileName, directory = '.') {
    const references = [];

    const jsconfigPath = 'jsconfig.json';
    const paths = readJsConfig(jsconfigPath);

    if (!fs.lstatSync(directory).isDirectory()) {
        console.error('您输入的不是文件夹');
        return references;
    }

    const validExtensions = validateFile(targetFileName);
    if (!validExtensions) {
        console.error('请提供有效的文件名，文件扩展名应为 .ts, .js, .tsx, 或 .jsx');
        return references;
    }

    targetFileName = targetFileName.replace(/\.[^/.]+$/, ""); // 去除文件扩展名

    references.push(...searchReferences(directory, targetFileName, jsconfigPath, paths));

    return references;
}
