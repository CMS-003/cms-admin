import { proxy } from 'valtio';

/**
 * 编辑器状态：工具栏（保存按钮）和画布之间唯一需要打通的东西。
 *
 * 为什么单独拎出来：
 * - 保存按钮在 composer/page.tsx 的工具栏里，而树在 TView 内部，层级差着两层
 * - dirtyCount 要能驱动按钮高亮，所以必须是 valtio proxy 才能被 useSnapshot 订阅
 * - 不用全局单例：TView 是多实例的（画布 / Tab 内嵌 / dynamic 页），
 *   共用一个 status 会让嵌套实例的脏数据串到外层工具栏上。
 *   所以由「需要工具栏的那一层」创建，按 props 往下传；独立使用的 TView 自己造一个。
 *
 * 后面要加的 edit_node_id（当前编辑节点）/ current_node_id（鼠标所在节点）
 * 也放在这里，属于同一类「编辑器级共享状态」。
 *
 * ⚠️ 这两个字段是**高频**变化的（鼠标每滑过一个节点就写一次），
 * 消费方一律用 `useProxySelector` 做值级订阅，不要用 `useSnapshot` 整体订阅，
 * 否则画布上所有节点 + 工具栏都会跟着重渲染。
 */
export type EditorStatus = {
  /** 待提交的变更数量（新增 + 修改 + 删除），0 表示没有脏数据 */
  dirtyCount: number;
  /** 正在提交 */
  saving: boolean;
  /** 提交变更。由 TView 挂载时注入；没有 TView 时是空操作 */
  save: () => Promise<void>;
  /**
   * 当前正在编辑的节点 id（右键菜单「编辑属性」进来的那个）。'' 表示没在编辑。
   *
   * 只存 id、不存节点对象：节点对象要从树里取，这样节点被删掉时自然就取不到了，
   * 也不会在这里留一份可能过期的副本。编辑模式下的选中框也用它。
   */
  editNodeId: string;
  /** EditorPanel 打开时定位到哪个 tab：base / widget / data / event / layout */
  editNodeTab: string;
  /**
   * 鼠标所在的节点 id。由 NodeWrapper 的 mouseenter / mouseleave 维护
   * （mouseenter 不冒泡，所以拿到的永远是鼠标底下最内层的那个节点）。
   *
   * 拖拽期间它承载的是**落点容器**：hitTest 算出来的 containerId 直接写进来，
   * 让容器把高亮画在自己身上 —— 比在画布上盖一层算出来的矩形准得多，
   * Table / GridLayout 这类自定义子结构靠 rect 是框不准的。
   */
  currNodeId: string;
  /** 是否正在拖拽。决定 currNodeId 用「悬停」配色还是「落点」配色 */
  dragging: boolean;
};

export function createEditorStatus(): EditorStatus {
  return proxy<EditorStatus>({
    dirtyCount: 0,
    saving: false,
    save: async () => { },
    editNodeId: '',
    editNodeTab: 'base',
    currNodeId: '',
    dragging: false,
  });
}
