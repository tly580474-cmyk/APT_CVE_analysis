# Bug 修复记录

## 2026-03-17

### Bug #1: 文档管理页面白屏问题

#### 问题描述
管理员在文档管理界面执行编辑文档或新建文档操作时，有 50% 的概率会跳转到空白界面。

#### 问题原因
WangEditor 编辑器的 `useEffect` 清理逻辑依赖项为 `[editor]`，当用户打开/关闭 Modal 时，由于 React 状态更新和组件卸载的竞态条件，编辑器可能在 DOM 已卸载后仍尝试访问，导致白屏。

#### 涉及文件
- `frontend/src/pages/Documents/Documents.jsx`

#### 修复方案
修改 useEffect 的依赖项，从 `[editor]` 改为 `[isEditModalVisible]`，确保每次 Modal 关闭时编辑器都会被正确销毁。

```javascript
// 修改前
}, [editor]);

// 修改后  
}, [isEditModalVisible]);
```

#### 修复状态
✅ 已修复
