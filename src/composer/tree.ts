import { cloneDeep, isEqual } from 'lodash-es';
import { getSnapshot, isStateTreeNode } from 'mobx-state-tree';
import { v7 as uuidv7 } from 'uuid';
import type { FlatNode, ITemplate } from '@/types';

/**
 * 扁平化的模板数据（纯数据层）。
 *
 * 结构性的变更操作都在 treeStore.ts 的 MST action 里（读写同源），
 * 这里只留「不依赖 store 实例」的纯函数：归一化、新建、payload、接收判定。
 *
 * - 所有节点平铺在 map 里，key 是 _id
 * - 每个节点的 children 是「子节点 id 的有序列表」
 * - 每个节点的 parent_id 是「父节点 id」，根的直接子级 parent_id 为 ''
 * - children 和 parent_id 是冗余的双写关系，只允许通过 store 的
 *   insertAt / remove / move 修改，别处一律只读。
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
 * 入参可以是 MST 节点实例，也可以是普通对象 / snapshot。
 *
 * - children：本地存的是 id 列表，后端是每个子节点一行、靠 parent_id 关联，
 *   所以不能把这个字段回传（旧版 MST 的 toJSON() 同样剔掉了 children）
 * - $origin / $new / $selected：纯编辑态
 *
 * 返回的是浅对象（attrs / style / widget 仍是原引用），直接发给接口没问题；
 * 但要落成基线必须先 cloneDeep，否则之后改 attrs 会把「原数据」一起改掉。
 */
export function toPayload(node: any): Record<string, any> {
  const snap = node && typeof node === 'object' && isStateTreeNode(node)
    ? (getSnapshot(node) as Record<string, any>)
    : (node as Record<string, any>) ?? {};
  const out: Record<string, any> = {};
  for (const key of Object.keys(snap)) {
    if (key === 'children') continue;
    if (key.startsWith('$')) continue;
    out[key] = snap[key];
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
 * 把服务端返回的树打平成 map（供 TreeStore.load 使用）。
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
 * 新建节点（返回普通 snapshot，由 store.insertAt 放进 map）。
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
// 结构变更的辅助计算
// ---------------------------------------------------------------------------

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
