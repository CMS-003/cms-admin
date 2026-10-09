import { IComponent, IPageInfo, IWidget } from "./component"
export * from "./user"
export * from "./menu"
export * from "./component"
export * from "./project"
export * from "./resource"
export * from "./table"

declare global {
  interface Window {
    goto: (url: string) => void;
    sendCustomEvent: (view_id: string, name: string, data?: any) => void;
  }
}

export type ITemplate = {
  _id: string;
  project_id: string;
  title: string;
  name: string;
  desc: string;
  cover: string;
  type: string;
  path: string;
  attrs: object;
  style: object;
  available: boolean;
  order: number;
  children: IComponent[]
}

export type ISNS = {
  _id?: string;
  sns_id?: string;
  sns_type: string;
  status: number;
}

export type ILog = {
  _id: string;
  type: string;
  group: string;
  content: string;
  createdAt: Date;
}

export type IBindings = {
  root: {
    ref: (element: HTMLElement | null) => void;
    'data-node-id': string;
    'data-node-type': string;
  };
  /** 右键菜单：由各组件挂到 .node-handle（拖拽手柄）上，只有手柄区域可右键 */
  onContextMenu?: React.MouseEventHandler<any>;
  handleRef: (element: Element | null) => void;
  isDragging: boolean;
}

/**
 * 扁平化之后的节点。
 *
 * children 从「节点对象数组」换成了「子节点 id 的有序列表」，
 * 反向指针是 parent_id（根的直接子级为 ''）。
 * 每个节点在树 store 的 map 里是唯一一份，所以对象引用可以当身份用。
 *
 * 注意：节点自身的子树信息不在 children 里，需要子节点对象时用 childrenNodes
 * （由 NodeWrapper 从 TreeContext 解析后传下来）。
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
  widget: IWidget;
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

  [props: string]: any;
};

export type IBaseCom = {
  self: FlatNode;
  /** 子节点对象数组（self.children 是 id 列表，这个才是对象） */
  childrenNodes: FlatNode[];
  /**
   * 按 id 解析任意节点的子节点对象。
   * 需要往下多看一层时用（例如 Table 的列里还要渲染列自己的子节点）。
   */
  resolveChildren: (id: string) => FlatNode[];
  bindings: IBindings;
  setNodeField: (node: ITemplate | IComponent | FlatNode, key: string, value: any) => void;
  source: any;
  setDataField: (widget: IWidget, value: any) => void;
  mode: 'edit' | 'preview';
  page: IPageInfo;
  children: any;
  [props: string]: any;
};

export type INode = {
  self: FlatNode;
  source: any;
  setNodeField: (node: ITemplate | IComponent | FlatNode, key: string, value: any) => void;
  setDataField: (widget: IWidget, value: any) => void;
  onContextMenu?: React.MouseEventHandler<any>;
  [props: string]: any;
}
