import { createContext } from 'react';
import type { TreeStoreInstance } from './treeStore';

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
