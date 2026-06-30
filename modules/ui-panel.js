// ---- 操作栏 ----
var actionBar = document.createElement('div');
actionBar.style.cssText = 'display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap;';

// 编辑按钮
var editBtn = document.createElement('button');
editBtn.className = 'action-btn warning';
editBtn.textContent = '✏️ 编辑';
editBtn.addEventListener('click', function() {
    editMode = !editMode;
    this.textContent = editMode ? '✅ 完成编辑' : '✏️ 编辑';
    this.style.borderColor = editMode ? '#ffb74d' : '#444';
    renderUI();
    if (editMode) showToast('📝 编辑模式：点击删除，右键移动');
});
actionBar.append(editBtn);

// 导出按钮
var exportBtn = document.createElement('button');
exportBtn.className = 'action-btn';
exportBtn.textContent = '📤 导出';
exportBtn.addEventListener('click', function() {
    var json = templateManager.exportTemplates();
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '标注助手模板_' + new Date().toISOString().slice(0,10) + '.json';
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('✅ 模板已导出');
});
actionBar.append(exportBtn);

// 导入按钮
var importBtn = document.createElement('button');
importBtn.className = 'action-btn';
importBtn.textContent = '📥 导入';
importBtn.addEventListener('click', function() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
            var json = ev.target.result;
            var overwrite = confirm('是否覆盖已存在的同名模板？\n点击"确定"覆盖，点击"取消"跳过重复');
            var result = templateManager.importTemplates(json, overwrite);
            if (result) {
                showToast('✅ 导入完成：新增 ' + result.imported + ' 个，跳过 ' + result.skipped + ' 个');
                updateSelector();
                renderUI();
                tagOps.refreshSelections();
                updateButtons();
            } else {
                showToast('❌ 导入失败，请检查文件格式', true);
            }
        };
        reader.readAsText(file);
        input.remove();
    });
    input.click();
});
actionBar.append(importBtn);

// 保存模板按钮
var saveBtn = document.createElement('button');
saveBtn.className = 'action-btn success';
saveBtn.textContent = '💾 保存模板';
saveBtn.addEventListener('click', function() {
    var name = prompt('请输入模板名称:', '模板-' + new Date().toLocaleDateString());
    if (name) {
        var tpl = templateManager.createTemplate(name);
        if (tpl) { updateSelector();
            renderUI(); }
    }
});
actionBar.append(saveBtn);

// 删除模板按钮
var delBtn = document.createElement('button');
delBtn.className = 'action-btn danger';
delBtn.textContent = '🗑️ 删除';
delBtn.addEventListener('click', function() {
    var cid = templateManager.getCurrentId();
    if (cid && confirm('删除当前模板？')) {
        templateManager.deleteTemplate(cid);
        updateSelector();
        renderUI();
        tagOps.refreshSelections();
        updateButtons();
    }
});
actionBar.append(delBtn);

// 刷新按钮
var refreshBtn = document.createElement('button');
refreshBtn.className = 'action-btn';
refreshBtn.textContent = '🔄 刷新';
refreshBtn.addEventListener('click', function() { renderUI();
    updateSelector();
    showToast('🔄 已刷新'); });
actionBar.append(refreshBtn);

panel.append(actionBar);
