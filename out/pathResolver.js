"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveImportPath = resolveImportPath;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// 解析import路径到实际文件路径
function resolveImportPath(importPath, currentFilePath, aliasConfig, workspaceRoot) {
    try {
        // console.log(`[PathResolver] 解析路径: ${importPath}, 当前文件: ${currentFilePath}`);
        let resolvedPath = importPath;
        // 处理别名路径
        for (const [alias, aliasPath] of Object.entries(aliasConfig)) {
            if (importPath.startsWith(alias)) {
                resolvedPath = importPath.replace(alias, path.join(workspaceRoot, aliasPath));
                // console.log(`[PathResolver] 别名解析: ${importPath} -> ${resolvedPath}`);
                break;
            }
        }
        // 处理相对路径
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
            const currentDir = path.dirname(currentFilePath);
            resolvedPath = path.resolve(currentDir, importPath);
            // console.log(`[PathResolver] 相对路径解析: ${importPath} -> ${resolvedPath}`);
        }
        else if (!path.isAbsolute(resolvedPath) && !resolvedPath.includes(workspaceRoot)) {
            // 如果不是绝对路径且没有通过别名解析，尝试相对于当前文件解析
            const currentDir = path.dirname(currentFilePath);
            resolvedPath = path.resolve(currentDir, importPath);
            // console.log(`[PathResolver] 默认相对路径解析: ${importPath} -> ${resolvedPath}`);
        }
        // 检查index文件（如果resolvedPath是一个目录）
        if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
            const indexPath = path.join(resolvedPath, 'index');
            for (const ext of ['.js', '.ts', '.jsx', '.tsx', '.json']) {
                const fullIndexPath = indexPath + ext;
                if (fs.existsSync(fullIndexPath) && fs.statSync(fullIndexPath).isFile()) {
                    // console.log(`[PathResolver] 找到index文件: ${fullIndexPath}`);
                    return fullIndexPath;
                }
            }
        }
        // 尝试不同的文件扩展名和大小写变体
        const possibleVariants = [
            resolvedPath,
            resolvedPath + '.js',
            resolvedPath + '.ts',
            resolvedPath + '.jsx',
            resolvedPath + '.tsx',
            resolvedPath + '/index.js',
            resolvedPath + '/index.ts',
            resolvedPath + '/index.jsx',
            resolvedPath + '/index.tsx',
            // 添加大小写变体
            resolvedPath.toLowerCase(),
            resolvedPath.toLowerCase() + '.js',
            resolvedPath.toLowerCase() + '.ts',
            (resolvedPath.charAt(0).toUpperCase() + resolvedPath.slice(1)),
            (resolvedPath.charAt(0).toUpperCase() + resolvedPath.slice(1)) + '.js',
            (resolvedPath.charAt(0).toUpperCase() + resolvedPath.slice(1)) + '.ts'
        ];
        // console.log(`[PathResolver] 尝试文件变体: ${possibleVariants.slice(0, 5).join(', ')}...`);
        for (const variant of possibleVariants) {
            if (fs.existsSync(variant) && fs.statSync(variant).isFile()) {
                // console.log(`[PathResolver] 找到文件: ${variant}`);
                return variant;
            }
        }
        // console.log(`[PathResolver] 未找到文件: ${importPath}`);
        return null;
    }
    catch (error) {
        console.error(`[PathResolver] 解析路径失败 ${importPath}:`, error);
        return null;
    }
}
//# sourceMappingURL=pathResolver.js.map