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

---

### Bug #2: 导航栏菜单项在窗口缩放时消失

#### 问题描述
当用户改变浏览器界面尺寸（宽度）后，导航栏的部分项目会"消失"，刷新后会重新出现。

#### 问题原因
Ant Design 的 Menu 组件在 `mode="horizontal"` 模式下，当窗口变窄时，会自动隐藏超出容器的菜单项。这是其默认的响应式行为，导致部分导航项被隐藏。

#### 涉及文件
- `frontend/src/components/Layout/Layout.jsx`

#### 修复方案
1. 移除菜单的固定宽度限制 `min-w-[500px]`，改为 `flex-1` 自适应容器
2. 添加 `flexWrap: 'nowrap'` 样式防止菜单项换行
3. 给 Header 添加 `minWidth: 'fit-content'` 防止被压缩

```javascript
// 修改前
className="border-0 bg-transparent min-w-[500px]"
style={{ background: 'transparent', border: 'none' }}

// 修改后
className="border-0 bg-transparent flex-1"
style={{ background: 'transparent', border: 'none', flexWrap: 'nowrap' }}
```

#### 修复状态
✅ 已修复
