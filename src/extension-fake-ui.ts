import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export function activate(context: vscode.ExtensionContext) {
  const provider = new ColorsViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ColorsViewProvider.viewType,
      provider
    )
  );

  vscode.commands.registerCommand(
    "calicoColors.customCommand",
    (uri: vscode.Uri) => {
      // 获取当前工作区的根路径
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders) {
        const workspaceRoot = workspaceFolders[0].uri.fsPath; // 获取第一个工作区的根路径
        const relativePath = path.relative(workspaceRoot, uri.fsPath); // 计算相对路径

        // 显示信息框
        vscode.window.showInformationMessage(
          `Custom command executed on: ${relativePath}`
        );
        console.log(relativePath,"000")

        // 显示颜色视图
        provider.addText(relativePath); // 这里调用 addColor 方法来显示颜色视图
      } else {
        vscode.window.showInformationMessage(`No workspace folder found.`);
      }
    }
  );

  // 注册反向查找引用命令
  vscode.commands.registerCommand(
    "calicoColors.reverseLookup",
    async (uri: vscode.Uri) => {
      console.log("反向查找命令被触发！文件路径:", uri.fsPath);
      
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders) {
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const relativePath = path.relative(workspaceRoot, uri.fsPath);
        const fileName = path.basename(uri.fsPath);

        console.log("工作区根路径:", workspaceRoot);
        console.log("文件相对路径:", relativePath);
        console.log("文件名:", fileName);

        // 查找引用
        const references = await findFileReferences(uri.fsPath, workspaceRoot);
        console.log("找到的引用:", references);

        // 显示引用结果
        provider.showReferences(fileName, references);
      } else {
        vscode.window.showErrorMessage("没有找到工作区文件夹");
      }
    }
  );
}

// 查找文件引用的函数
async function findFileReferences(targetFilePath: string, workspaceRoot: string): Promise<Array<{file: string, line: number, content: string}>> {
  const references: Array<{file: string, line: number, content: string}> = [];
  
  // 获取目标文件的相对路径和文件名（不包含扩展名）
  const targetRelativePath = path.relative(workspaceRoot, targetFilePath);
  const targetFileName = path.basename(targetFilePath, path.extname(targetFilePath));
  
  console.log("目标文件相对路径:", targetRelativePath);
  console.log("目标文件名:", targetFileName);

  // 递归搜索工作区中的所有文件
  function searchDirectory(dirPath: string) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳过 node_modules, .git 等目录
        if (!['node_modules', '.git', 'out', 'dist', '.vscode'].includes(file)) {
          searchDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        // 只检查 JS/TS 文件
        if (file.match(/\.(js|ts|jsx|tsx)$/)) {
          searchInFile(fullPath);
        }
      }
    }
  }

  function searchInFile(filePath: string) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // 查找 import 语句
        if (line.includes('import') && line.includes(targetFileName)) {
          // 检查是否是导入目标文件
          const importRegex = /import\s+.*\s+from\s+['"`]([^'"`]+)['"`]/;
          const match = line.match(importRegex);
          
          if (match) {
            const importPath = match[1];
            console.log(`在文件 ${filePath} 第 ${index + 1} 行找到导入: ${importPath}`);
            
            // 解析导入路径
            const resolvedPath = resolveImportPath(filePath, importPath, workspaceRoot);
            console.log(`解析后的路径: ${resolvedPath}`);
            console.log(`目标文件路径: ${targetFilePath}`);
            
            if (resolvedPath === targetFilePath) {
              references.push({
                file: filePath,
                line: index + 1,
                content: line.trim()
              });
              console.log("匹配成功！添加到引用列表");
            }
          }
        }
      });
    } catch (error) {
      console.error(`读取文件 ${filePath} 时出错:`, error);
    }
  }

  searchDirectory(workspaceRoot);
  return references;
}

// 解析导入路径
function resolveImportPath(fromFile: string, importPath: string, workspaceRoot: string): string | null {
  const fromDir = path.dirname(fromFile);
  
  try {
    let resolvedPath: string;
    
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      // 相对路径
      resolvedPath = path.resolve(fromDir, importPath);
    } else if (importPath.startsWith('/')) {
      // 绝对路径
      resolvedPath = path.join(workspaceRoot, importPath.substring(1));
    } else {
      // 可能是别名路径，尝试解析
      if (importPath.startsWith('@/')) {
        // 假设 @/ 指向 src/ 目录
        resolvedPath = path.join(workspaceRoot, 'src', importPath.substring(2));
      } else {
        // 相对于工作区根目录的路径
        resolvedPath = path.join(workspaceRoot, importPath);
      }
    }
    
    // 尝试不同的文件扩展名
    const extensions = ['', '.js', '.ts', '.jsx', '.tsx', '.json'];
    for (const ext of extensions) {
      const testPath = resolvedPath + ext;
      if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
        return testPath;
      }
    }
    
    // 检查是否是目录，如果是，查找 index 文件
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
      for (const ext of ['.js', '.ts', '.jsx', '.tsx']) {
        const indexPath = path.join(resolvedPath, 'index' + ext);
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
    }
    
  } catch (error) {
    console.error(`解析路径 ${importPath} 时出错:`, error);
  }
  
  return null;
}

class ColorsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "calicoColors.colorsView";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // 监听来自webview的消息
    webviewView.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case "openFile":
            // 打开文件并跳转到指定行
            const uri = vscode.Uri.file(message.filePath);
            vscode.window.showTextDocument(uri).then(editor => {
              if (message.line) {
                const position = new vscode.Position(message.line - 1, 0);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(new vscode.Range(position, position));
              }
            });
            break;
        }
      },
      undefined
    );
  }

  public addText(text: string) {
    if (this._view) {
      this._view.webview.postMessage({ type: "addText", text: text });
    }
  }

  public showReferences(fileName: string, references: Array<{file: string, line: number, content: string}>) {
    console.log("显示引用结果:", fileName, references);
    if (this._view) {
      this._view.webview.postMessage({ 
        type: "showReferences", 
        fileName: fileName, 
        references: references 
      });
    } else {
      console.error("Webview未初始化，无法显示引用结果");
      vscode.window.showErrorMessage("请先在左侧活动栏中打开'反向查找引用'面板");
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the VS Code webview UI toolkit
    const toolkitUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "node_modules", "@vscode", "webview-ui-toolkit", "dist", "toolkit.js")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="zh-CN">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>反向查找引用</title>
				
				<!-- VS Code WebView UI Toolkit -->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
				<script type="module" nonce="${nonce}" src="${toolkitUri}"></script>
				
				<style>
					body {
						background-color: var(--vscode-editor-background);
						color: var(--vscode-foreground);
						font-family: var(--vscode-font-family);
						font-size: var(--vscode-font-size);
						margin: 0;
						padding: 16px;
					}

					.search-summary {
						margin-bottom: 16px;
						font-size: 13px;
						color: var(--vscode-descriptionForeground);
					}

					.no-references {
						text-align: center;
						padding: 24px;
						color: var(--vscode-descriptionForeground);
						font-style: italic;
					}
				</style>
			</head>
			<body>
				<div class="container">
					<!-- 内容将通过 JavaScript 动态生成 -->
				</div>

				<script nonce="${nonce}">
					// WebView API
					const vscode = acquireVsCodeApi();

					// 监听来自扩展的消息
					window.addEventListener("message", (event) => {
						const message = event.data;
						console.log("收到消息:", message);
						
						switch (message.type) {
							case "showReferences":
								showReferencesResults(message.fileName, message.references);
								break;
						}
					});

					// 按文件分组引用
					function groupReferencesByFile(references) {
						const grouped = {};
						references.forEach(ref => {
							if (!grouped[ref.file]) {
								grouped[ref.file] = [];
							}
							grouped[ref.file].push(ref);
						});
						return grouped;
					}

					// 获取唯一文件数量
					function getUniqueFileCount(references) {
						const uniqueFiles = new Set(references.map(ref => ref.file));
						return uniqueFiles.size;
					}

					// 高亮显示导入内容
					function highlightImportContent(content, fileName) {
						const fileNameWithoutExt = fileName.replace(/\\.[^/.]+$/, "");
						const regex = new RegExp('(' + fileNameWithoutExt + ')', 'gi');
						return content.replace(regex, '<span style="background-color: var(--vscode-editor-findMatchHighlightBackground); color: var(--vscode-editor-findMatchHighlightForeground); padding: 1px 2px; border-radius: 2px;">$1</span>');
					}

					// 显示引用结果 - 使用 VS Code UI 组件
					function showReferencesResults(fileName, references) {
						const container = document.querySelector(".container");
						container.innerHTML = "";

						// 统计信息
						const summary = document.createElement("div");
						summary.className = "search-summary";
						summary.textContent = getUniqueFileCount(references) + ' 文件中有 ' + references.length + ' 个结果';
						container.appendChild(summary);

						if (references.length === 0) {
							const noResults = document.createElement("div");
							noResults.className = "no-references";
							noResults.textContent = '未找到对 "' + fileName + '" 的引用';
							container.appendChild(noResults);
							return;
						}

						// 使用 VS Code UI 组件创建树形视图
						const treeView = document.createElement("vscode-tree");
						
						const groupedReferences = groupReferencesByFile(references);
						
						Object.entries(groupedReferences).forEach(([filePath, fileReferences]) => {
							// 创建文件树项
							const fileTreeItem = document.createElement("vscode-tree-item");
							
							const fileNameOnly = filePath.split('/').pop();
							const fileDir = filePath.substring(0, filePath.lastIndexOf('/'));
							
							// 设置文件节点内容
							const fileLabel = document.createElement("div");
							fileLabel.style.display = "flex";
							fileLabel.style.alignItems = "center";
							fileLabel.style.width = "100%";
							
							fileLabel.innerHTML = 
								'<vscode-tag style="margin-right: 8px;">JS</vscode-tag>' +
								'<span style="color: var(--vscode-symbolIcon-fileForeground, #DCDCAA); font-weight: 500;">' + fileNameOnly + '</span>' +
								'<span style="color: var(--vscode-descriptionForeground); font-size: 12px; margin-left: 8px;">' + fileDir + '</span>' +
								'<vscode-badge style="margin-left: auto;">' + fileReferences.length + '</vscode-badge>';
							
							fileTreeItem.appendChild(fileLabel);

							// 为每个引用创建子树项
							fileReferences.forEach(ref => {
								const refTreeItem = document.createElement("vscode-tree-item");
								
								const highlightedContent = highlightImportContent(ref.content, fileName);
								
								const refLabel = document.createElement("div");
								refLabel.style.display = "flex";
								refLabel.style.alignItems = "center";
								refLabel.style.cursor = "pointer";
								refLabel.style.padding = "4px 0";
								
								refLabel.innerHTML = 
									'<span style="min-width: 30px; font-size: 11px; color: var(--vscode-editorLineNumber-foreground); text-align: right; margin-right: 12px; font-family: var(--vscode-editor-font-family);">' + ref.line + '</span>' +
									'<span style="flex: 1; font-size: 12px; font-family: var(--vscode-editor-font-family);">' + highlightedContent + '</span>';
								
								// 点击跳转功能
								refLabel.addEventListener("click", () => {
									vscode.postMessage({ 
										type: "openFile", 
										filePath: ref.file,
										line: ref.line 
									});
								});

								// 悬停效果
								refLabel.addEventListener("mouseenter", () => {
									refLabel.style.backgroundColor = "var(--vscode-list-hoverBackground)";
								});
								
								refLabel.addEventListener("mouseleave", () => {
									refLabel.style.backgroundColor = "transparent";
								});
								
								refTreeItem.appendChild(refLabel);
								fileTreeItem.appendChild(refTreeItem);
							});

							treeView.appendChild(fileTreeItem);
						});

						container.appendChild(treeView);
					}
				</script>
			</body>
			</html>`;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}