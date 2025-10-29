import { path } from "path";
// 验证目标文件名。
function validateFile(targetFileName) {
    const validExtensions = ['.ts', '.js', '.tsx', '.jsx'];
    const fileExtension = path.extname(targetFileName);
    return validExtensions.includes(fileExtension);
}

module.exports = { validateFile };
