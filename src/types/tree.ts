/**
 * 模板树的**数据形态**（不含任何实现）。
 *
 * 服务端下发的是嵌套结构（IComponent.children 里塞子对象），编辑器把它
 * 打平成下面的 FlatNode：所有节点平铺在一张表里，子节点用 id 列表挂。
 * 具体实现见 `store/tree`。
 */

/**
 * 扁平化之后的节点。
 *
 * - children 从「节点对象数组」变成「子节点 id 的有序列表」
 * - 反向指针是 parent_id（挂在页面根下的直接子级为 ''）
 * - tree_id 是它所属那棵一级子树的 id（后端按它分页 / 缓存 / 失效），
 *   规则见 `store/tree/factory.ts` 的 resolveTreeId
 *
 * ⚠️ 运行时 `self` 拿到的是 `store/tree` 里的 **MST 节点实例**，不是普通对象：
 * 除了下面这些数据字段，它还有 `getApi()` / `payload` / `changed` 等视图
 * （索引签名就是为这些视图留的口子）。这里只声明节点组件会用到的那部分。
 */
export type FlatNode = {
  _id: string;
  type: string;
  parent_id: string;
  children: string[];
  template_id: string;
  project_id: string;
  tree_id: string;
  title: string;
  name: string;
  icon: string;
  cover: string;
  desc: string;
  url: string;
  order: number;
  status: number;
  attrs: any;
  style: any;
  /** 运行时是 MST 的 widget 模型实例（结构化 model，字段可直接赋值） */
  widget: any;
  accepts: string[];
  queries: string[];
  resources: any[];

  // ---------- 编辑态字段：数据库里没有，只在编辑器 / 预览里用 ----------
  /**
   * 从数据库读回来时的快照（不含 $ 字段和 children）。
   * 拿它和当前值对比就知道这个节点改过没有 —— 本次保存要提交哪些节点就靠它。
   */
  $origin: any;
  /** 编辑器里新加、还没落库的节点 */
  $new: boolean;
  /** 编辑模式下选中态，预览时取代 attrs.selected 用 */
  $selected: boolean;
  $selected_id?: string;

  [view: string]: any;
};

/** 一棵扁平化之后的模板树（`normalizeTree` 的产出） */
export type TreeData = {
  rootId: string;
  map: Record<string, FlatNode>;
};

/** 拖放落点：放进哪个容器的第几个位置 */
export type DropTarget = {
  containerId: string;
  index: number;
};

/**
 * 一次提交里「按 tree_id 归组」之后的变更。
 *
 * 一棵一级子树（tree_id 相同）就是后端失效缓存的最小单位：
 * changed 是这棵树里改过 / 新增的节点 payload，removed 是要删的节点 id。
 */
export type TreeChange = {
  tree_id: string;
  changed: Record<string, any>[];
  removed: string[];
};
