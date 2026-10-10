/**
 * 模板页数据层（模板树）：工厂 + store。
 *
 * - `factory.ts` —— 纯函数：服务端数据 ↔ 扁平树、新建节点、提交 payload
 * - `model.ts`   —— MST 模型：TreeStore（读写同源）+ createTreeStore 工厂
 *
 * TreeNode / TreeStoreInstance 是模型派生类型，只能和模型放在一起
 * （`types/` 里放的是与实现无关的数据形态，见 types/tree.ts）。
 */
export { TreeStore, NodeModel, createTreeStore } from './model';
export type { TreeNode, TreeStoreInstance } from './model';
export {
  normalizeTree,
  createNode,
  toPayload,
  resolveTreeId,
  resolveInsertIndex,
} from './factory';
export type { CreateNodeOptions } from './factory';
