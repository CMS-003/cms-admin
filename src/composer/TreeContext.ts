import { createContext } from 'react';
import type { TreeStoreInstance } from './treeStore';
import type { EditorStatus } from './status';

/**
 * 扁平树 store（mobx-state-tree 实例）。
 *
 * 由 TView 提供，实例身份稳定。MST 实例的读取是可追踪的——
 * 配合 NodeWrapper 的 observer，map / children 变化会自动触发重渲染，
 * 不再需要 valtio 时代「读快照建依赖、写走 live store」的两半结构。
 *
 * TView 可嵌套（nodes/Tab 里会再渲染一个 TView 做预览），
 * 每一层都会覆盖 Provider，天然做到实例隔离。
 */
export const TreeContext = createContext<TreeStoreInstance | null>(null);

/**
 * 编辑器状态（editNodeId / currNodeId）走 context 而不是逐层 props：
 * NodeWrapper 是递归渲染的，Table / GridLayout 内部还会再渲染一层 NodeWrapper，
 * 走 props 得挨个改 8 个节点组件。TView 提供，NodeWrapper 消费。
 *
 * 脱离 Provider 时是 null，消费方要自己兜底（独立渲染节点时不带编辑态）。
 */
export const EditorStatusContext = createContext<EditorStatus | null>(null);
