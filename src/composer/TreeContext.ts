import { createContext } from 'react';
import type { TreeApi } from './tree';

/**
 * 扁平的树读写接口。
 *
 * 由 TView 提供，身份稳定（不随数据变化），所以 NodeWrapper 的 memo 不会被它打破；
 * 接口内部读的是 TView 最新的快照代理，因此读操作照常建立响应式依赖。
 *
 * TView 可嵌套（nodes/Tab 里会再渲染一个 TView 做预览），
 * 每一层都会覆盖 Provider，天然做到实例隔离。
 */
export const TreeContext = createContext<TreeApi | null>(null);
