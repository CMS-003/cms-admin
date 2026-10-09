import { cloneDeep, isEqual } from 'lodash-es';
import { v7 as uuidv7 } from 'uuid';
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

// ---------------------------------------------------------------------------
// 编辑态字段
// ---------------------------------------------------------------------------
//
// 数据库里没有、只在编辑器里用的字段，统一以 $ 开头：
// - $origin  节点从数据库读回时的快照，用来判断「这个节点改过没有」
// - $new     这个节点是编辑器里新加的，还没落库
// - $selected  编辑模式下的选中态，预览时取代 attrs.selected 用
//
// 保存时一律剥掉（见 toPayload）。

/**
 * 剥离编辑态字段，得到可直接发给后端的 payload。
 *
 * - children：本地存的是 id 列表，后端是每个子节点一行、靠 parent_id 关联，
 *   所以不能把这个字段回传（旧版 MST 的 toJSON() 同样剔掉了 children）
 * - $origin / $new / $selected：纯编辑态
 *
 * 返回的是浅对象（attrs / style / widget 仍是原引用），直接发给接口没问题；
 * 但要落成基线必须先 cloneDeep，否则之后改 attrs 会把「原数据」一起改掉。
 */
export function toPayload(node: FlatNode): Record<string, any> {
  const out: Record<string, any> = {};
  for (const key of Object.keys(node)) {
    if (key === 'children') continue;
    if (key.startsWith('$')) continue;
    out[key] = (node as any)[key];
  }
  return out;
}

/** 节点相对 $origin 是否已变更。新增的节点（$new）恒为「已变更」。 */
export function isNodeChanged(node: FlatNode): boolean {
  if (node.$new) return true;
  return !isEqual(node.$origin, toPayload(node));
}

/**
 * 收集整棵树里需要提交的节点 payload。
 * 根节点不算：根是 template 本身，走模板接口，不归组件接口管。
 *
 * 依赖 map 的插入顺序保证「父在子前」—— normalizTree 是前序插入，
 * insertAt 也只能挂到已存在的父节点上，所以这个不变量天然成立。
 */
export function collectChanges(data: TreeData): Record<string, any>[] {
  const out: Record<string, any>[] = [];
  for (const id of Object.keys(data.map)) {
    if (id === data.rootId) continue;
    const node = data.map[id];
    if (node && isNodeChanged(node)) {
      out.push(toPayload(node));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// 树 -> 扁平
// ---------------------------------------------------------------------------

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
 * 新节点的 tree_id：
 * - 直接挂在 template 下的一级子节点，自身 tree_id 是空串
 * - 其余节点取「它所属那棵一级子树」的根 id，也就是继承父节点的 tree_id；
 *   父节点本身就是一级节点时它的 tree_id 是空串，所以回落到父节点自己的 _id
 */
export function resolveTreeId(parent: FlatNode, parentIsRoot: boolean): string {
  if (parentIsRoot) return '';
  return parent.tree_id || parent._id;
}

/**
 * 把服务端返回的树打平成 map。
 *
 * 顺带做三件归一化（都在算 $origin 之前，所以不会产生假变更）：
 * 1. tree_id 按上面的规则重算 —— 它是纯结构派生字段，重算结果和 createNode 一致
 * 2. order 按数组下标重写成 0..n-1，让后续结构变更的重排有唯一基准
 * 3. accepts 从组件类型表回填（旧版 MST 的 afterCreate 也是这么干的）
 *
 * @param resolveAccepts 按 type 名查该类型允许接收的子节点类型；返回 undefined 表示查不到，保留服务端值
 */
export function normalizeTree(
  template: ITemplate | null | undefined,
  resolveAccepts?: (type: string) => string[] | undefined,
): TreeData {
  const map: Record<string, FlatNode> = {};
  if (!template) return { rootId: '', map };
  const rawRoot: any = template;

  const walk = (raw: any, parentId: string, depth: number, index: number, treeId: string) => {
    const isRoot = depth === 0;
    const node: FlatNode = {
      ...raw,
      parent_id: parentId,
      children: toIdList(raw),
      tree_id: treeId,
      order: isRoot ? (raw.order ?? 0) : index,
      $origin: {},
      $new: false,
      $selected: false,
    };

    if (!isRoot && resolveAccepts) {
      const accepts = resolveAccepts(raw.type);
      if (accepts) node.accepts = accepts;
    }

    map[raw._id] = node;

    // 一级子节点自身 tree_id 为空串，它的子节点（二级）才拿到它的 id
    const childTreeId = depth === 0 ? '' : depth === 1 ? raw._id : treeId;
    const children: any[] = Array.isArray(raw.children) ? raw.children : [];
    children.forEach((child, i) => walk(child, raw._id, depth + 1, i, childTreeId));

    // 基线（根不参与 diff，不用记）
    if (!isRoot) {
      node.$origin = cloneDeep(toPayload(node));
    }
  };

  walk(rawRoot, '', 0, 0, rawRoot.tree_id ?? '');
  return { rootId: rawRoot._id, map };
}

// ---------------------------------------------------------------------------
// 新建节点
// ---------------------------------------------------------------------------

export type CreateNodeOptions = {
  type: string;
  /** 挂到哪个父节点下 */
  parent: FlatNode;
  parentIsRoot: boolean;
  /** 落点下标，写进 order */
  index: number;
  template_id?: string;
  project_id?: string;
  /** 该类型允许接收的子节点类型（来自组件类型表） */
  accepts?: string[];
};

/**
 * 新建节点。
 * id 用 uuid v7（时间有序，落库后按 id 排序也近似按创建时间排序）。
 */
export function createNode(o: CreateNodeOptions): FlatNode {
  const attrs: Record<string, any> = {};
  // 沿用旧 appendChild 的特例
  if (o.type === 'MenuItem') attrs.path = '/dynamic';

  return {
    _id: uuidv7(),
    type: o.type,
    parent_id: o.parent._id,
    children: [],
    template_id: o.template_id || o.parent.template_id || '',
    project_id: o.project_id || o.parent.project_id || '',
    tree_id: resolveTreeId(o.parent, o.parentIsRoot),
    title: '无',
    name: '',
    icon: '',
    cover: '',
    desc: '',
    url: '',
    order: o.index,
    status: 1,
    attrs,
    style: {},
    widget: { field: '', value: '', type: 'string', refer: [], action: '', method: '', query: false, source: '' },
    accepts: o.accepts ? o.accepts.slice() : [],
    queries: [],
    resources: [],
    $origin: {},
    $new: true,
    $selected: false,
  };
}

// ---------------------------------------------------------------------------
// 接口
// ---------------------------------------------------------------------------

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
  /**
   * 这个容器能不能接收该类型的子节点（拖放 / 新增共用这一个判定）。
   * root（template 本身）是页面壳，恒为 true；其余按 canAcceptIn 判定。
   */
  canAccept: (containerId: string, childType: string) => boolean;
  /** 这个节点相对 $origin 改过没有（新增的也算） */
  isDirty: (id: string) => boolean;
  /** 待提交的变更节点 id（新增 + 修改） */
  getDirtyIds: () => string[];
  /** 待提交删除的节点 id */
  getRemovedIds: () => string[];
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
  /** 按类型新建一个节点并插入，返回新节点 */
  createAndInsert: (parentId: string, index: number, type: string) => FlatNode | null;
  /** 把当前所有变更提交到后端 */
  save: () => Promise<void>;
};

export type TreeApi = TreeReader & TreeWriter;

// ---------------------------------------------------------------------------
// 结构变更的辅助计算
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// 拖放 / 新增子节点的接收判定
// ---------------------------------------------------------------------------

/** 父节点 accepts 里的通配项：声明了它就还能接收 level === 1 的其它类型 */
export const DROP_ACCEPT_ALL = 'all';

/**
 * 父节点能不能接收这个类型的子节点。
 *
 * 规则沿用旧版 componentManager.canDrop：
 * - 父节点的 accepts 里显式列出了子节点类型 → 接收
 * - 否则，只有「子节点类型的 level === 1 且父节点 accepts 含 'all'」才接收
 * - accepts 为空数组 → 什么都不收
 *
 * level 是「组件类型」的属性（不在节点上）：level 为 2 / 3 的类型只能被父节点
 * 点名接收，不能走 'all' 通配；level 为 1 的类型才能被声明了 'all' 的容器全收。
 * 拖动和新增两条路径都走这一个判定，避免两边规则跑偏。
 */
export function canAcceptIn(
  parentAccepts: string[] | undefined | null,
  childType: string,
  childLevel: number,
): boolean {
  if (!childType) return false;
  const accepts = parentAccepts || [];
  if (accepts.indexOf(childType) >= 0) return true;
  return childLevel === 1 && accepts.indexOf(DROP_ACCEPT_ALL) >= 0;
}

// ---------------------------------------------------------------------------
// map 级操作
//
// 全部是纯函数，只依赖 map 本身，不碰 valtio、不碰接口。
// 写进 map 的调用方（TView 的写接口）在外面补「变更簿记」：
// dirtyIds / removedIds / save。
// ---------------------------------------------------------------------------

function clampIndex(index: number, len: number): number {
  return Math.max(0, Math.min(index, len));
}

/** 自身 + 所有后代的 id（前序） */
export function collectSubtreeIds(map: Record<string, FlatNode>, id: string): string[] {
  const out: string[] = [];
  const dfs = (nid: string) => {
    out.push(nid);
    const n = map[nid];
    if (n) n.children.forEach(dfs);
  };
  dfs(id);
  return out;
}

/** 在父节点 children 里的下标，找不到返回 -1 */
export function getSiblingIndexIn(map: Record<string, FlatNode>, id: string): number {
  const node = map[id];
  if (!node) return -1;
  const parent = map[node.parent_id];
  return parent ? parent.children.indexOf(id) : -1;
}

/**
 * 该落点是否等价于「原地不动」
 * - 只有目标容器 == 当前父容器时才可能
 * - 同容器时，index == currentIndex 或 currentIndex + 1 都等于不动
 *   （+1 是因为：摘除当前节点后，它后面的空位填上来，再插回去就回到原位）
 */
export function isNoopDropIn(
  map: Record<string, FlatNode>,
  dragId: string,
  target: DropTarget,
): boolean {
  const node = map[dragId];
  if (!node) return false;
  if (node.parent_id !== target.containerId) return false;
  const siblings = map[target.containerId]?.children;
  if (!siblings) return false;
  const currentIndex = siblings.indexOf(dragId);
  if (currentIndex < 0) return false;
  return target.index === currentIndex || target.index === currentIndex + 1;
}

/** 新建并插入到 parent 的 index 位置。返回是否插入成功。 */
export function insertIntoMap(
  map: Record<string, FlatNode>,
  parentId: string,
  index: number,
  node: FlatNode,
): boolean {
  const parent = map[parentId];
  if (!parent || !node || !node._id) return false;
  // 跨 store 传进来的是普通对象，深拷贝一份再放进去，避免外部引用被间接改写
  map[node._id] = {
    ...cloneDeep(node),
    _id: node._id,
    parent_id: parentId,
    children: [],
  };
  const ids = parent.children.slice();
  ids.splice(clampIndex(index, ids.length), 0, node._id);
  parent.children = ids;
  return true;
}

/** 摘除整棵子树。返回被摘掉的 id 列表（含自身）。 */
export function removeFromMap(map: Record<string, FlatNode>, id: string): string[] {
  const node = map[id];
  if (!node) return [];
  const subtree = collectSubtreeIds(map, id);
  for (const nid of subtree) {
    delete map[nid];
  }
  const parent = map[node.parent_id];
  if (parent) parent.children = parent.children.filter((c) => c !== id);
  return subtree;
}

/**
 * 移动节点。
 * 返回「order 需要重排」的容器 id（同容器时只有一个）。
 */
export function moveInMap(
  map: Record<string, FlatNode>,
  id: string,
  parentId: string,
  index: number,
): string[] {
  const node = map[id];
  const to = map[parentId];
  if (!node || !to) return [];

  const sameContainer = node.parent_id === parentId;
  const fromId = node.parent_id;
  const from = map[fromId];
  const oldIndex = from ? from.children.indexOf(id) : -1;
  // 先摘除；index 的语义是「摘除之前」的兄弟列表里的落点
  if (from && oldIndex >= 0) {
    from.children = from.children.filter((c) => c !== id);
  }
  const target = resolveInsertIndex(sameContainer, oldIndex, index);
  const ids = to.children.slice();
  ids.splice(clampIndex(target, ids.length), 0, id);
  to.children = ids;
  if (node.parent_id !== parentId) node.parent_id = parentId;

  return sameContainer ? [parentId] : [fromId, parentId];
}

/**
 * 按数组顺序把某个容器的 children 的 order 重写成 0..n-1。
 * 返回真正被改动的 id —— 调用方据此决定要重算哪些节点的变更状态。
 */
export function reindexInMap(map: Record<string, FlatNode>, parentId: string): string[] {
  const parent = map[parentId];
  if (!parent) return [];
  const changed: string[] = [];
  parent.children.forEach((cid, i) => {
    const child = map[cid];
    if (!child) return;
    if (child.order !== i) {
      child.order = i;
      changed.push(cid);
    }
  });
  return changed;
}

/**
 * 节点移动 / 插入之后，按 tree_id 的规则重写整棵子树。
 *
 * tree_id 是「所属那一级子树的根 id」，所以一旦换了父节点，
 * 从被移动节点往下的所有后代都可能要改（跨一级子树移动时是整棵子树都变）。
 * 返回 tree_id 真正被改动的 id。
 */
export function refreshSubtreeTreeIds(
  map: Record<string, FlatNode>,
  id: string,
  newParentId: string,
): string[] {
  const parent = map[newParentId];
  const node = map[id];
  if (!parent || !node) return [];

  // 只有 template 根节点的 parent_id 是空串
  const parentIsRoot = parent.parent_id === '';
  const myTreeId = resolveTreeId(parent, parentIsRoot);
  // 自己成了一级节点时，子节点要拿自己的 id；否则和自己是同一个所属子树
  const childTreeId = parentIsRoot ? id : myTreeId;

  const changed: string[] = [];
  const setTid = (nid: string, tid: string) => {
    const n = map[nid];
    if (!n) return;
    if (n.tree_id !== tid) {
      n.tree_id = tid;
      changed.push(nid);
    }
  };
  /** 自己赋 tid，后代继续用 nextTid */
  const walk = (nid: string, tid: string, nextTid: string) => {
    setTid(nid, tid);
    const n = map[nid];
    if (!n) return;
    n.children.forEach((c) => walk(c, nextTid, nextTid));
  };

  walk(id, myTreeId, childTreeId);
  return changed;
}

export { cloneDeep };
