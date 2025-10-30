// 反向查找引用的webview脚本
(function () {
  const vscode =  // 显示反向查找引用的结果
  function showReferencesResults(fileName, references) {
    console.log("显示引用结果:", fileName, references);
    const container = document.querySelector(".container");
    if (!container) {
      console.error("找不到.container元素");
      return;
    }
    
    // 清空现有内容
    container.innerHTML = "";
    
    // 创建简洁的标题
    const title = document.createElement("h3");
    title.textContent = `${references.length} 个引用`;
    title.style.margin = "0 0 12px 0";
    title.style.fontSize = "14px";
    title.style.color = "var(--vscode-foreground)";
    container.appendChild(title);

  // 监听来自扩展的消息
  window.addEventListener("message", (event) => {
    const message = event.data;
    console.log(message, "message");
    switch (message.type) {
      case "addText":
        {
          const input = document.querySelector(".current-file");
          if (input) {
            input.value = message?.text;
          }
        }
        break;
      case "showReferences":
        {
          console.log("接收到showReferences消息:", message);
          showReferencesResults(message.fileName, message.references);
        }
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
    const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    const regex = new RegExp(`(${fileNameWithoutExt})`, 'gi');
    return content.replace(regex, '<span class="reference-highlight">$1</span>');
  }

  // 显示反向查找引用的结果
  function showReferencesResults(fileName, references) {
    console.log("显示引用结果:", fileName, references);
    const container = document.querySelector(".container");
    if (!container) {
      console.error("找不到.container元素");
      return;
    }
    
    // 清空现有内容
    container.innerHTML = "";
    
    // 创建搜索头部
    const header = document.createElement("div");
    header.className = "search-header";
    header.innerHTML = `
      <span class="search-icon">��</span>
      <p class="search-summary">${references.length} 个结果，包含于 ${getUniqueFileCount(references)} 个文件中</p>
    `;
    container.appendChild(header);
    
    if (references.length === 0) {
      const noResults = document.createElement("div");
      noResults.className = "no-references";
      noResults.textContent = `未找到对 "${fileName}" 的引用`;
      container.appendChild(noResults);
      return;
    }
    
    // 按文件分组并创建UI
    const groupedReferences = groupReferencesByFile(references);
    Object.entries(groupedReferences).forEach(([filePath, fileReferences]) => {
      const fileGroup = document.createElement("div");
      fileGroup.className = "reference-group";
      
      // 文件头部
      const fileHeader = document.createElement("div");
      fileHeader.className = "file-header";
      
      const fileName = filePath.split('/').pop();
      const fileDir = filePath.substring(0, filePath.lastIndexOf('/'));
      
      fileHeader.innerHTML = `
        <span class="collapse-icon">▼</span>
        <span class="file-icon">📄</span>
        <span class="file-name">${fileName}</span>
        <span class="file-path">${fileDir}</span>
      `;
      
      // 引用列表
      const referencesList = document.createElement("ul");
      referencesList.className = "references-list";
      
      fileReferences.forEach(ref => {
        const li = document.createElement("li");
        li.className = "reference-item";
        
        // 高亮显示导入的内容
        const highlightedContent = highlightImportContent(ref.content, fileName);
        
        li.innerHTML = `
          <span class="line-number">${ref.line}</span>
          <span class="reference-content">${highlightedContent}</span>
        `;
        
        // 点击跳转到文件
        li.addEventListener("click", () => {
          console.log("点击跳转到文件:", ref);
          vscode.postMessage({ 
            type: "openFile", 
            filePath: ref.file,
            line: ref.line 
          });
        });
        
        referencesList.appendChild(li);
      });
      
      // 折叠/展开功能
      fileHeader.addEventListener("click", () => {
        const icon = fileHeader.querySelector(".collapse-icon");
        const isCollapsed = icon.classList.contains("collapsed");
        
        if (isCollapsed) {
          icon.classList.remove("collapsed");
          icon.textContent = "▼";
          referencesList.style.display = "block";
        } else {
          icon.classList.add("collapsed");
          icon.textContent = "▶";
          referencesList.style.display = "none";
        }
      });
      
      fileGroup.appendChild(fileHeader);
      fileGroup.appendChild(referencesList);
      container.appendChild(fileGroup);
    });
  }
})();
