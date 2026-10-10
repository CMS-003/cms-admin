import { createContext } from 'react';
import { proxy } from 'valtio';
import type { EditorStatus } from '@/types';
import type { TreeStoreInstance } from '@/store/tree';

/**
 * 扁平树 store（MST 实例）的上下文。
 *
 * 由渲染模板的组件提供，实例身份稳定。MST 实例的读取是可追踪的 ——
 * 配合 NodeWrapper 的 observer，map / children 变化会自动触发重渲染，
 * 不需要 valtio 时代「读快照建依赖、写走 live store」的两半结构。
 *
 * 模板渲染器可以嵌套（nodes/Tab 里会再渲染一个做预览），每一层都会覆盖 Provider，
 * 天然做到实例隔离。脱离 Provider 时是 null，消费方自己兜底。
 */
export const TreeContext = createContext<TreeStoreInstance | null>(null);

/**
 * 编辑器状态（editNodeId / currNodeId）走 context 而不是逐层 props：
 * NodeWrapper 是递归渲染的，Table / GridLayout 内部还会再渲染一层 NodeWrapper。
 * 由「需要工具栏的那一层」创建后提供（独立渲染模板时自己造一份）。
 */
export const EditorStatusContext = createContext<EditorStatus | null>(null);

/** 编辑器状态工厂：一个编辑器实例一份（工具栏 / 画布 / 面板共用） */
export function createEditorStatus(): EditorStatus {
  return proxy<EditorStatus>({
    dirtyCount: 0,
    saving: false,
    save: async () => { },
    editNodeId: '',
    editNodeTab: 'base',
    currNodeId: '',
    dragging: false,
  });
}
