const fs = require('fs');

// 读取 jsconfig.json 文件并返回路径配置。
function readJsConfig(jsconfigPath) {
    if (fs.existsSync(jsconfigPath)) {
        const jsconfigContent = fs.readFileSync(jsconfigPath, 'utf8');
        const jsconfig = JSON.parse(jsconfigContent);
        return jsconfig?.compilerOptions?.paths || {};
    }
    return {};
}

module.exports = { readJsConfig };
