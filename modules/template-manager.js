// 模板管理模块 - 扫描、分组、CRUD + 导出/导入
window.__MODULES__ = window.__MODULES__ || {};
window.__MODULES__.templateManager = (function() {
    var CONFIG = window.__MODULES__.CONFIG;
    var utils = window.__MODULES__.utils;
    var showToast = utils.showToast;
    var unique = utils.unique;
    var safeJSONParse = utils.safeJSONParse;

    var templates = {};
    var currentTemplateId = null;

    function loadTemplates() {
        try {
            var saved = safeJSONParse(localStorage.getItem(CONFIG.templateStorageKey));
            if (saved && typeof saved === 'object') {
                templates = saved;
                if (templates._current) currentTemplateId = templates._current;
                return true;
            }
        } catch (e) {}
        return false;
    }

    function saveTemplates() {
        try {
            var data = Object.assign({}, templates);
            data._current = currentTemplateId;
            localStorage.setItem(CONFIG.templateStorageKey, JSON.stringify(data));
            return true;
        } catch (e) { return false; }
    }

    function scanAndGroup() {
        var allElements = document.querySelectorAll('.ant-tag-checkable, .ant-tag');
        var tagSet = new Set();
        allElements.forEach(function(el) {
            var text = el.textContent.trim();
            if (text && text.length > 0 && text.length < 30 &&
                !text.includes('条/页') && !text.includes('预览') && !text.includes('image_url')) {
                tagSet.add(text);
            }
        });
        var tags = Array.from(tagSet);
        if (tags.length === 0) {
            showToast('⚠️ 未找到标签', true);
            return null;
        }
        console.log('📋 扫描到 ' + tags.length + ' 个唯一标签:', tags);

        var groups = CONFIG.groups.map(function(g) {
            return { groupId: g.id, tags: [] };
        });
        var keywords = CONFIG.keywords;
        var unmatched = [];

        tags.forEach(function(tag) {
            var matched = false;
            for (var i = 0; i < groups.length; i++) {
                var kwList = keywords[groups[i].groupId] || [];
                for (var j = 0; j < kwList.length; j++) {
                    if (tag.includes(kwList[j]) || kwList[j].includes(tag)) {
                        groups[i].tags.push(tag);
                        matched = true;
                        break;
                    }
                }
                if (matched) break;
            }
            if (!matched) unmatched.push(tag);
        });

        var perGroup = Math.ceil(unmatched.length / groups.length);
        var start = 0;
        groups.forEach(function(group) {
            var end = Math.min(start + perGroup, unmatched.length);
            group.tags = group.tags.concat(unmatched.slice(start, end));
            start = end;
        });

        groups.forEach(function(g) { g.tags = unique(g.tags); });
        console.log('📂 分组结果:', groups.map(function(g) { return g.groupId + ': ' + g.tags.join(', '); }));
        return groups;
    }

    function createTemplate(name) {
        var grouped = scanAndGroup();
        if (!grouped) return null;
        var template = {
            id: 'tpl_' + Date.now(),
            name: name || '模板-' + new Date().toLocaleDateString(),
            groups: grouped,
            createdAt: new Date().toISOString()
        };
        templates[template.id] = template;
        currentTemplateId = template.id;
        saveTemplates();
        var count = grouped.reduce(function(sum, g) { return sum + g.tags.length; }, 0);
        showToast('✅ 模板 "' + template.name + '" 已保存 (' + count + ' 个标签)');
        return template;
    }

    function getCurrentTemplate() {
        loadTemplates();
        if (currentTemplateId && templates[currentTemplateId]) return templates[currentTemplateId];
        return null;
    }

    function getTemplateList() {
        loadTemplates();
        var list = [];
        for (var key in templates) {
            if (key !== '_current') {
                var t = templates[key];
                var count = 0;
                if (t.groups) t.groups.forEach(function(g) { count += g.tags ? g.tags.length : 0; });
                list.push({ id: key, name: t.name || key, count: count });
            }
        }
        return list;
    }

    function switchTemplate(id) {
        if (!templates[id]) { showToast('⚠️ 模板不存在', true); return false; }
        currentTemplateId = id;
        saveTemplates();
        var t = templates[id];
        var count = 0;
        if (t.groups) t.groups.forEach(function(g) { count += g.tags ? g.tags.length : 0; });
        showToast('🔄 已切换到: ' + t.name + ' (' + count + ' 个标签)');
        return true;
    }

    function deleteTemplate(id) {
        if (id === currentTemplateId) currentTemplateId = null;
        delete templates[id];
        saveTemplates();
        showToast('🗑️ 模板已删除');
        return true;
    }

    function editTemplate(id, groups) {
        if (!templates[id]) return false;
        templates[id].groups = groups;
        templates[id].updatedAt = new Date().toISOString();
        saveTemplates();
        return true;
    }

    function autoDetectAndApply() {
        loadTemplates();
        var grouped = scanAndGroup();
        if (!grouped) return null;
        var totalTags = grouped.reduce(function(sum, g) { return sum + g.tags.length; }, 0);
        if (totalTags === 0) { showToast('⚠️ 未找到标签', true); return null; }
        var keys = Object.keys(templates).filter(function(k) { return k !== '_current'; });
        if (keys.length === 0) return createTemplate('自动模板-' + new Date().toLocaleDateString());
        var bestMatch = null,
            bestScore = 0;
        var currentTags = [];
        grouped.forEach(function(g) { currentTags = currentTags.concat(g.tags); });
        keys.forEach(function(key) {
            var t = templates[key];
            var allTags = [];
            if (t.groups) t.groups.forEach(function(g) { allTags = allTags.concat(g.tags || []); });
            var matchCount = 0;
            currentTags.forEach(function(tag) { if (allTags.indexOf(tag) !== -1) matchCount++; });
            var score = matchCount / Math.max(currentTags.length, allTags.length);
            if (score > bestScore && score > 0.2) { bestScore = score;
                bestMatch = key; }
        });
        if (bestMatch) { switchTemplate(bestMatch); return bestMatch; }
        return createTemplate('自动模板-' + new Date().toLocaleDateString());
    }

    // ========== 新增：导出模板 ==========
    function exportTemplates() {
        loadTemplates();
        var data = JSON.parse(JSON.stringify(templates));
        data._exportInfo = {
            exportedAt: new Date().toISOString(),
            version: '3.2.0',
            total: Object.keys(data).filter(function(k) { return k !== '_current' && k !== '_exportInfo'; }).length
        };
        return JSON.stringify(data, null, 2);
    }

    // ========== 新增：导入模板 ==========
    function importTemplates(jsonStr, overwrite) {
        overwrite = overwrite || false;
        try {
            var data = JSON.parse(jsonStr);
            delete data._exportInfo;
            var importedCount = 0;
            var skippedCount = 0;
            var keys = Object.keys(data).filter(function(k) { return k !== '_current'; });
            for (var i = 0; i < keys.length; i++) {
                var id = keys[i];
                if (templates[id] && !overwrite) {
                    skippedCount++;
                    continue;
                }
                templates[id] = data[id];
                importedCount++;
            }
            if (data._current && templates[data._current]) {
                currentTemplateId = data._current;
            } else if (importedCount > 0) {
                var firstId = keys[0];
                if (firstId && templates[firstId]) {
                    currentTemplateId = firstId;
                }
            }
            saveTemplates();
            return { imported: importedCount, skipped: skippedCount };
        } catch (e) {
            console.error('导入模板失败:', e);
            return null;
        }
    }

    // ========== 新增：获取所有模板 ==========
    function getAllTemplates() {
        loadTemplates();
        return templates;
    }

    loadTemplates();

    return {
        getCurrentTemplate: getCurrentTemplate,
        getTemplateList: getTemplateList,
        createTemplate: createTemplate,
        deleteTemplate: deleteTemplate,
        switchTemplate: switchTemplate,
        editTemplate: editTemplate,
        autoDetectAndApply: autoDetectAndApply,
        scanAndGroup: scanAndGroup,
        getCurrentId: function() { return currentTemplateId; },
        // 新增导出导入
        exportTemplates: exportTemplates,
        importTemplates: importTemplates,
        getAllTemplates: getAllTemplates
    };
})();
