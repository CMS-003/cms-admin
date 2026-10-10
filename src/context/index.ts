/**
 * 全部上下文（Provider / hook）的统一出口。
 *
 * 编辑器与节点组件只需要认这一个路径：
 * ```
 * import { useSource, useActions, useMode, usePage, useQuery } from '@/context';
 * ```
 * 分层：
 * - `./page` —— 页面级：mode / page / title（低频）
 * - `./data` —— 数据环境：source / query / actions（快照 vs 订阅两种语义）
 * - `./tree` —— 树 store 与编辑器状态（MST 实例 + valtio proxy）
 */
export * from './page';
export * from './data';
export * from './tree';
