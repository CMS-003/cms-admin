import { cloneDeep } from 'lodash-es';
import { getSnapshot, isStateTreeNode } from 'mobx-state-tree';
import { v7 as uuidv7 } from 'uuid';
import type { FlatNode, ITemplate, TreeData } from '@/types';

/**
 * 模板树的**工厂**（纯函数，不依赖 store 实例）。
 *
 * 结构性的变更操作在 `store/tree/model.ts` 的 MST action 里，这里只负责
 * 「服务端数据 → 扁平树」「新建一个节点」「节点 → 提交 payload」这三件事。
 *
 * 数据形态约定：
 * - 所有节点平铺在 map 里，key 是 _id
 * - 每个节点的 children 是「子节点 id 的有序列表」
 * - 每个节点的 parent_id 是「父节点 id」，挂页面根下的直接子级为 ''
 * - children 和 parent_id 是冗余的双写关系，只允许 store 的
 *   insertAt / remove / move 改，别处一律只读
 */

// ---------------------------------------------------------------------------
// 节点 -> payload
// ---------------------------------------------------------------------------

/**
 * 剥离编辑态字段，得到可直接发给后端的 payload。
 * 入参可以是 MST 节点实例，也可以是普通对象 / snapshot。
 *
 * - children：本地存的是 id 列表，后端是每个子节点一行、靠 parent_id 关联，
 *   所以不能把这个字段回传
 * - $origin / $new / $selected：纯编辑态
 *
 * 返回的是浅对象（attrs / style 仍是原引用），直接发接口没问题；
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
 * 节点的 tree_id（它所属那棵「子树」的标识）。
 *
 * 规则 —— 后端以 tree_id 为单位做翻页 / 缓存 / 失效，所以这棵树里的**每一个**节点
 * 都必须带同一个 tree_id：
 * - 直接挂在 template 下的一级子节点，**自身就是这棵子树的根** → tree_id = 自身 _id
 * - 其余节点继承所属子树的根 id，也就是父节点的 tree_id
 *
 * ⚠️ 「一级子节点自己也带这个 id」这一点很关键：一条改动落到
 * batchUpdateComponent 的 payload 里时，后端要靠 tree_id 找出它属于哪棵树去
 * 失效 / 刷新缓存。一级子节点如果漏了（早年写成空串），那么「改一级子节点本身」
 * 这类 diff 后端就认不出所属子树。
 *
 * @param selfId 正在创建 / 迁移的那个节点自己的 _id（一级子节点拿它当 tree_id）
 */
export function resolveTreeId(parent: FlatNode, selfId: string, parentIsRoot: boolean): string {
  if (parentIsRoot) return selfId;
  return parent.tree_id || parent._id;
}

/**
 * 把服务端返回的树打平成 map。
 *
 * 顺带做三件归一化（都在算 $origin 之前，所以不会产生假变更）：
 * 1. tree_id 按上面的规则重算（一级子节点 = 自身 _id）
 * 2. order 按数组下标重写成 0..n-1，让后续结构变更的重排有唯一基准
 * 3. accepts 从组件类型表回填
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
    // 一级子节点是所在子树的根：tree_id 取自身 _id；其余继承父节点的 tree_id
    const resolvedTreeId = isRoot ? (raw.tree_id ?? '') : depth === 1 ? raw._id : treeId;
    const node: FlatNode = {
      ...raw,
      parent_id: parentId,
      children: toIdList(raw),
      tree_id: resolvedTreeId,
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

    // 往下传的就是这个节点自己的 tree_id：一级节点传自身 id 给二级，
    // 之后整棵子树沿用同一个值
    const children: any[] = Array.isArray(raw.children) ? raw.children : [];
    children.forEach((child, i) => walk(child, raw._id, depth + 1, i, resolvedTreeId));

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
 * 新建节点的 snapshot（由 store.insertAt 放进 map）。
 * id 用 uuid v7（时间有序，落库后按 id 排序也近似按创建时间排序）。
 *
 * tree_id 依赖自己的 _id（一级子节点 = 自身 _id），所以 id 必须先算出来。
 * 这一点直接决定新节点进 diff 时 payload 里的 tree_id 对不对 ——
 * 新加的一级节点如果 tree_id 是空串，后端认不出它属于哪棵树。
 */
export function createNode(o: CreateNodeOptions): FlatNode {
  const attrs: Record<string, any> = {};
  // 沿用旧 appendChild 的特例
  if (o.type === 'MenuItem') attrs.path = '/dynamic';

  const _id = uuidv7();

  return {
    _id,
    type: o.type,
    parent_id: o.parent._id,
    children: [],
    template_id: o.template_id || o.parent.template_id || '',
    project_id: o.project_id || o.parent.project_id || '',
    tree_id: resolveTreeId(o.parent, _id, o.parentIsRoot),
    title: '',
    name: '',
    icon: '',
    cover: '',
    desc: '无',
    url: '',
    order: o.index,
    status: 1,
    attrs,
    style: {},
    widget: { field: '', value: '', type: 'string', refer: [], action: '', method: '', query: false, source: '', from: 'data', mapping: {} },
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
