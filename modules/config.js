// ==================== 配置模块 ====================
window.__MODULES__ = window.__MODULES__ || {};
window.__MODULES__.CONFIG = {
    // 基础设置
    clickDelay: 50,
    debug: false,
    dropdownTimeout: 500,
    operationTimeout: 30000,

    // 存储键名
    storageKey: 'tag-panel-pos',
    selectionStorageKey: 'tag-selections-v3',
    templateStorageKey: 'tag-templates-v3',
    groupTypeStorageKey: 'tag-group-types',    // 存储用户自定义的分组类型

    // 面板默认位置
    defaultPosition: { top: 100, right: 20 },

    // 分组定义（defaultType 仅作初始值，用户可在 UI 中切换）
    groups: [
        { id: 'correctness', label: '属性值正确性判断', icon: '📋', defaultType: 'radio' },
        { id: 'evidence',     label: '证据来源',        icon: '📷', defaultType: 'checkbox' },
        { id: 'errorTypes',   label: '错误问题类型',    icon: '❌', defaultType: 'radio' }
    ],

    // 智能分组关键词（用于自动扫描）
    keywords: {
        correctness: ['准确', '错误', '无法判断', '暂定准确', '正确', '不正确'],
        evidence:     ['image', 'subject', 'desc', 'seller', '图片', '标题', '描述'],
        errorTypes:   ['答非所问', '模型幻觉', '类目错放', '回答不全', '回答多了', '多余', '其他原因']
    },

    dropdownTargetText: '无法判断',

    // ---------- 分组类型管理 ----------
    // 获取分组实际类型（优先用户设置，若无则使用默认）
    getGroupType: function(groupId) {
        try {
            var saved = JSON.parse(localStorage.getItem(this.groupTypeStorageKey));
            if (saved && saved[groupId]) {
                return saved[groupId];
            }
        } catch (_) {}
        var group = this.groups.find(function(g) { return g.id === groupId; });
        return group ? group.defaultType : 'checkbox';
    },

    // 保存用户设置的分组类型
    setGroupType: function(groupId, type) {
        try {
            var saved = JSON.parse(localStorage.getItem(this.groupTypeStorageKey)) || {};
            saved[groupId] = type;
            localStorage.setItem(this.groupTypeStorageKey, JSON.stringify(saved));
        } catch (_) {}
    }
};
