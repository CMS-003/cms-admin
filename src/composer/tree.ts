import { cloneDeep } from 'lodash-es';
import type { FlatNode, ITemplate } from '@/types';

/**
 * 扁平化的模板数据。
 *
 * 原来的树形结构里 children 存的是「节点对象本身」，改完之后：
 * - 所有节点平铺在 map 里，key 是 _id
 * - 每个节点的 children 是「子节点 id 的有序列表」
 * - 每个节点的 parent_id 是「父节点 id」，根的直接子级 parent_id 为 ''
 *
 * children 和 parent_id 是冗余的双写关系，只允许通过 TreeWriter 里的
 * insertAt / remove / move 修改，别处一律只读。
 */
export type TreeData = {
  rootId: string;
  map: Record<string, FlatNode>;
};

export type DropTarget = { containerId: string; index: number };

function toIdList(raw: any): string[] {
  const list: string[] = [];
  const children = raw && raw.children;
  if (!Array.isArray(children)) return list;
  for (const child of children) {
    if (child && child._id) list.push(child._id);
  }
  return list;
}

/**
 * 把服务端返回的树打平成 map。
 * 注意只做浅拷贝一层：attrs / style 这些子对象仍是原引用。
 */
export function normalizeTree(template: ITemplate | null | undefined): TreeData {
  const map: Record<string, FlatNode> = {};
  if (!template) return { rootId: '', map };
  const rawRoot: any = template;

  const walk = (raw: any, parentId: string) => {
    const childIds = toIdList(raw);
    map[raw._id] = { ...raw, parent_id: parentId, children: childIds };
    const children = Array.isArray(raw.children) ? raw.children : [];
    for (const child of children) {
      walk(child, raw._id);
    }
  };

  walk(rawRoot, '');
  return { rootId: rawRoot._id, map };
}

/** 读接口：渲染期用。实现方必须从「最新快照」上读，否则不会建立响应式依赖。 */
export type TreeReader = {
  rootId: string;
  getNode: (id: string) => FlatNode | undefined;
  getChildren: (id: string) => FlatNode[];
  getParent: (id: string) => FlatNode | undefined;
  /** 在父节点的 children 里的下标，找不到返回 -1 */
  getSiblingIndex: (id: string) => number;
  /** 自身 + 所有后代的 id */
  collectSubtree: (id: string) => string[];
  /** 该落点是否等价于「原地不动」 */
  isNoopDrop: (dragId: string, target: DropTarget) => boolean;
};

/** 写接口：只在事件回调里用。所有结构性变更的唯一入口，内部保证双写一致。 */
export type TreeWriter = {
  /** 新建并插入一个节点 */
  insertAt: (parentId: string, index: number, node: FlatNode) => void;
  /** 摘除节点（含其整棵子树） */
  remove: (id: string) => void;
  /** 把已有节点移动到目标位置 */
  move: (id: string, parentId: string, index: number) => void;
  /** 改节点上的某个字段，key 支持 'attrs.x' 这种路径 */
  setField: (id: string, key: string, value: any) => void;
};

export type TreeApi = TreeReader & TreeWriter;

/** 环检测：目标父节点不能是被移动节点自身或它的后代 */
export function isDescendant(targetParentId: string, nodeId: string, subtree: string[]): boolean {
  return targetParentId === nodeId || subtree.indexOf(targetParentId) >= 0;
}

/**
 * 计算「先摘除、再插入」之后的最终下标。
 *
 * move() 的 index 语义是「在摘除之前的兄弟列表里的落点」，
 * 所以同容器内往后移时，摘掉自己之后所有兄弟都前移了一位。
 */
export function resolveInsertIndex(
  sameContainer: boolean,
  oldIndex: number,
  index: number,
): number {
  if (sameContainer && oldIndex >= 0 && oldIndex < index) {
    return index - 1;
  }
  return index;
}

export { cloneDeep };
