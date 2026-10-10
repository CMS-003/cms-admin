import type { IWidget } from './component';
import type { FlatNode } from './tree';

/**
 * 编辑器的**渲染契约**：容器怎么渲染节点、节点组件拿到什么、编辑器状态是什么。
 * 数据形态在 `types/component.ts` / `types/tree.ts`，这里只放「编辑器怎么用数据」。
 */

/** 编辑 / 预览 */
export type IMode = 'edit' | 'preview';

/** 页面级共享信息（由页面上下文的 Provider 下发） */
export type IPageInfo = {
  template_id: string;
  path: string;
  param: { [key: string]: string };
  query: { [key: string]: string | number };
  setQuery: (field: string, value: number | string) => void;
  close: Function;
};

/**
 * 下发给节点根元素的绑定。
 *
 * 各节点组件把它展开在根 div 上：`<div {...bindings.root}>`。
 * 拖拽、选中框、右键入口全靠这几个属性，节点组件不需要知道它们怎么来的。
 */
export type IBindings = {
  root: {
    ref: (element: HTMLElement | null) => void;
    'data-node-id': string;
    'data-node-type': string;
    /**
     * 编辑态选中标记（'' | 'edit' | 'curr' | 'drag'），由 NodeWrapper 计算后下发。
     * CSS 用 `.node[data-mark='xx']::after` 画选框，节点组件不用管。
     */
    'data-mark'?: string;
    /** 鼠标进出节点。用于维护 EditorStatus.currNodeId */
    onMouseEnter?: React.MouseEventHandler<any>;
    onMouseLeave?: React.MouseEventHandler<any>;
  };
  /** 右键菜单：由各组件挂到 .node-handle（拖拽手柄）上，只有手柄区域可右键 */
  onContextMenu?: React.MouseEventHandler<any>;
  handleRef: (element: Element | null) => void;
  isDragging: boolean;
};

/**
 * 传给节点组件的方法集合。
 *
 * 三种写只有三个去处：节点自身字段（模板树）、查询条件域、当前子树的数据源。
 * 节点组件只管调，落到哪里由所在的数据环境决定（见 `context/data`）。
 */
export type INodeActions = {
  /** 写节点字段，key 支持 'attrs.x' / 'widget.field' 路径（落到树 store 的 action） */
  setNodeField: (node: any, key: string, value: any) => void;
  /** 写表单数据源；widget.query 为真时落到 page.query */
  setDataField: (widget: IWidget, value: any) => void;
  /** 写页面 query */
  setQuery: (field: string, value: any) => void;
};

/**
 * 节点组件的入参 —— **只包含节点自己的东西**。
 *
 * 共享数据（source / query / mode / page / actions）一律从 `@/context` 的 hook 取，
 * 不再逐层下传：容器渲染子节点时漏传一个就是一个 bug，历史上漏过 page、漏过 source。
 */
export type IBaseCom = {
  self: FlatNode;
  bindings: IBindings;
  /** 子节点对象数组（self.children 是 id 列表，这个才是对象） */
  childrenNodes: FlatNode[];
  /**
   * 按 id 解析任意节点的子节点对象。
   * 需要往下多看一层时用（例如 Table 的列里还要渲染列自己的子节点）。
   */
  resolveChildren: (id: string) => FlatNode[];
  /** 容器可以把子节点的 JSX 直接摊开摆放（编辑态用） */
  children?: React.ReactNode;
  /** FilterRow → FilterTag：把「选中的是哪个标签」广播给同级 */
  onSelect?: (id: string) => void;
};

/**
 * NodeWrapper 的入参。
 * 共享数据（source / query / actions）不在里面 —— 那些走 `@/context`。
 */
export type INode = {
  self: FlatNode;
  onContextMenu?: React.MouseEventHandler<any>;
  /** 透传给子节点（见 IBaseCom.onSelect） */
  onSelect?: (id: string) => void;
  [props: string]: any;
};

/** 右键菜单动作：面板跳转 / 新增子节点 / 删除 */
export type MenuAction = {
  kind: 'edit' | 'append' | 'delete';
  nodeId: string;
  /** kind === 'append'：要新建的子节点类型 */
  type?: string;
  /** kind === 'edit'：EditorPanel 打开后定位到哪个 tab */
  tab?: string;
};

/**
 * 编辑器状态：工具栏（保存按钮）和画布之间唯一需要打通的东西。
 *
 * - 由「需要工具栏的那一层」创建，按 props 往下传；独立使用的 TemplateView 自己造一份
 * - 是 valtio proxy（要能细粒度订阅）。⚠️ 消费方一律用 `useProxySelector`
 *   做值级订阅：currNodeId 跟着鼠标高频变化，整体订阅会让整个画布重渲染
 */
export type EditorStatus = {
  /** 待提交的变更数量（新增 + 修改 + 删除），0 表示没有脏数据 */
  dirtyCount: number;
  /** 正在提交 */
  saving: boolean;
  /** 提交变更。由模板渲染器挂载时注入；没有它时是空操作 */
  save: () => Promise<void>;
  /**
   * 当前正在编辑的节点 id（右键菜单「编辑属性」进来的那个）。'' 表示没在编辑。
   *
   * 只存 id、不存节点对象：节点对象要从树里取，这样节点被删掉时自然就取不到了。
   */
  editNodeId: string;
  /** EditorPanel 打开时定位到哪个 tab：base / widget / data / event / layout */
  editNodeTab: string;
  /**
   * 鼠标所在的节点 id。由 NodeWrapper 的 mouseenter / mouseleave 维护
   * （mouseenter 不冒泡，拿到的永远是鼠标底下最内层的那个节点）。
   *
   * 拖拽期间它承载的是**落点容器**：hitTest 算出来的 containerId 直接写进来，
   * 让容器把高亮画在自己身上 —— 比在画布上盖一层算出来的矩形准得多。
   */
  currNodeId: string;
  /** 是否正在拖拽。决定 currNodeId 用「悬停」配色还是「落点」配色 */
  dragging: boolean;
};
