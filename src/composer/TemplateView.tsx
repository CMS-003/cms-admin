import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DragMoveEvent, DragOverlay, DragStartEvent, DragDropProvider } from '@dnd-kit/react';
import { ContextMenuContent, ContextMenuContext, MenuAction } from './ContextMenu';
import { PointerSensor, PointerActivationConstraints } from '@dnd-kit/dom';
import { IPageInfo } from '@/types';
import { ModeContext, PageContext } from '../groups/context';
import apis from '@/api';
import store from '@/store';
import { message, Spin } from 'antd';
import { Palette } from './Palette';
import { NodeWrapper } from './NodeWrapper';
import { EditorPanel } from './EditorPanel';
import { ContainerInfo, measureContainers, hitTest, getIndicatorRect } from './geometry';
import { TreeContext, EditorStatusContext } from './TreeContext';
import { normalizeTree } from './tree';
import { TreeStore, TreeStoreInstance } from './treeStore';
import { canAcceptType, typeAccepts } from './componentTypes';
import { createDragPreview } from './preview';
import { EditorStatus, createEditorStatus } from './status';

import { useLocalProxy, useProxySelector } from '@/utils/valtio';
import { proxy, subscribe } from 'valtio';
import { autorun } from 'mobx';
import { observer } from 'mobx-react';
import { createNodeActions, createQueryScope } from './data';
import { DataEnv, DataEnvContext } from './DataContext';

/**
 * 节点样式（.node / .node-handle / 选中框 / 右键菜单 …）。
 *
 * 放在这里而不是 composer/page.tsx：TView 是所有渲染路径的公共入口 ——
 * 编辑器、弹框（ModalView）、动态页（pages/dynamic）都渲染它。
 * 挂在 page.tsx 上时，不走编辑器的路径因为**懒加载**拿不到这份 CSS，
 * `.node` 的 box-sizing / display:flex / position:relative 全丢，
 * 表现就是弹框和动态页里布局散架、选中框定位错乱。
 * CSS 是全局的，import 在这个模块就等于「凡是用到 TView 的地方都在」。
 */
import './styles.css';

/**
 * 该元素是否允许发起拖拽。
 * 命中 [data-no-dnd] 的祖先（如 GridCell、react-grid-layout 容器）时禁止拖动。
 */
function shouldHandleEvent(element: Element | null): boolean {
  let cur: Element | null = element;
  while (cur) {
    const dataset = (cur as HTMLElement).dataset;
    if (dataset && dataset.noDnd) {
      return false;
    }
    cur = cur.parentElement;
  }
  return true;
}

const PALETTE_PREFIX = 'palette:';
const GAP_TRANSITION_MS = 220; // 略大于 CSS 里 gap 过渡的 200ms

/**
 * 把 path 里的 query string 解析成查询条件的初值（'?id=1&a=2' → { id: '1', a: '2' }）。
 *
 * 旧版 AutoPage 就是这么干的：`Object.fromEntries(new URLSearchParams(path.split('?')[1]))`。
 * 作用是把「地址栏」变成页面查询条件的来源 —— 打开弹框时 path 传 '?id=xxx'，
 * 弹框里的模板（Form）就能通过 useQuery('id') 读到记录 id 去拉详情。
 */
function parseQuery(path?: string) {
  if (!path) return {} as Record<string, string>;
  const qs = path.split('?')[1];
  if (!qs) return {} as Record<string, string>;
  return Object.fromEntries(new URLSearchParams(qs)) as Record<string, string>;
}

export type TViewProps = {
  template_id: string;
  mode: 'edit' | 'preview';
  path: string;
  close: Function;
  /**
   * 把树 store 交给外层（TemplateView 拖拽用）。
   * 用 ref 直连而不是全局事件：TView 是多实例的（画布 / Tab 内嵌 / dynamic 页），
   * 全局事件会让三个实例互相串台。
   */
  apiRef?: React.MutableRefObject<TreeStoreInstance | null>;
  /**
   * 编辑器状态（脏数据数量 / 保存 / 当前编辑节点）。由需要工具栏的那一层创建后传进来；
   * 独立渲染 TView 时不传，内部自己造一个。
   */
  status?: EditorStatus;
};

export const TView = React.memo(observer(function T({ template_id, mode, path, close, apiRef, status }: TViewProps) {
  // 编辑器状态要在 action 之前解析：menuAction 要写它。
  // 用 ref 读，避免闭包捕获到旧对象。
  const [ownStatus] = useState(() => createEditorStatus());
  const editorStatus = status ?? ownStatus;
  const statusRef = useRef(editorStatus);
  statusRef.current = editorStatus;

  // 树 store：MST 实例，读写同源。observer 包着，加载完成 / 结构变化会自动重渲染
  const [store] = useState(() => TreeStore.create({}));

  /**
   * 页面级共享数据（模板 id / 路径 / 查询条件）。
   *
   * 必须**身份稳定**：原来这行是 `const page = proxy(...)` 直接写在 render 里，
   * 每次渲染都会造出一个**新的 proxy**。于是「写」和「读」落在两个不同的对象上：
   * Select 通过 actions 把 status 写进了最新的那个 proxy（setQuery 里打印得到），
   * 而 Table / Form 这类在 `useEffectOnce` / `useCallback` 里捕获过 page 的节点，
   * 读到的永远是**第一次渲染**造出来的那个死对象 —— 搜索事件触发 init 时
   * `page.query` 自然是空的。
   * 用 useState 建一次，后续所有渲染复用同一个实例，读写才同源。
   */
  const [page] = useState(() => proxy<IPageInfo>({
    template_id,
    path,
    close,
    param: {},
    // path 里的 query string 是查询条件的初值（见 parseQuery 的注释）
    query: parseQuery(path) as any,
    setQuery(field, value) {
      // const query = cloneDeep(this.query);
      // query[field] = value
      // this.query = query;
      this.query[field] = value;
    },
  }));

  // template_id / path / close 是 props 派生出来的，props 变了要同步进同一个实例。
  // 只改字段、不换对象 —— 换对象就等于把上面那条「身份稳定」又破坏了。
  useEffect(() => {
    if (page.template_id !== template_id) page.template_id = template_id;
    if (page.path !== path) {
      page.path = path;
      // path 换了（弹框换记录 / 动态页跳转）要重新落一次查询条件。
      // 不重新解析的话 Form 读到的 id 还是上一条记录的 —— 弹框会一直显示旧数据。
      page.query = parseQuery(path) as any;
    }
    if (page.close !== close) page.close = close;
  }, [page, template_id, path, close]);

  // ---------- 数据环境 ----------
  // 一个模板页只建一份。三种数据的归属：
  //   query  → 挂在 page 上（列表页的查询条件整页共用），逐字段写、按值订阅
  //   source → 模板级就是 store.source（MST frozen，整体替换成新对象）
  //   子树的 source（Table 的行 / Form 的详情）由各自的 <SourceScope> 覆盖
  const query = useMemo(() => createQueryScope(page), [page]);

  const env = useMemo<DataEnv>(() => ({
    // 读一次 store.source：整体替换时（setSource 会 cloneDeep）引用变化，
    // observer 追踪到 → TView 重渲染 → env 重建 → 子树拿到新快照
    source: store.source,
    query,
    actions: createNodeActions({
      query,
      setNodeField(node: any, key: string, value: any) {
        const id = typeof node === 'string' ? node : node && node._id;
        if (id) store.setField(id, key, value);
      },
      writeSource: (field, value) => store.setSource(field, value),
    }),
  }), [store, query, store.source]);

  // ---------- 数据加载 ----------
  const refreshTemplateDetail = useCallback(async () => {
    try {
      if (!template_id) return;
      store.setKV('loading', true)
      const resp = await apis.getTemplateComponents(template_id);
      // normalizeTree 一次性把 $origin 基线、order、tree_id、accepts 归一化
      const data = normalizeTree(resp.data as any, typeAccepts);
      store.setKV('template_id', template_id)
      store.load(data);
      // 换页/刷新后原来编辑的节点已经不存在了，别留着 id 指向空气
      statusRef.current.editNodeId = '';
      store.setKV('loading', false)
    } catch (err) {
      store.setKV('loading', false)
      console.log(err)
    }
  }, [template_id, store])

  useEffect(() => {
    refreshTemplateDetail()
  }, [template_id])

  // ---------- 编辑器状态同步（工具栏保存按钮靠这个）----------
  useEffect(() => {
    editorStatus.save = () => store.save();
    const dispose = autorun(() => {
      editorStatus.dirtyCount = store.dirtyCount;
      editorStatus.saving = store.saving;
    });
    return () => {
      dispose();
      editorStatus.save = async () => { };
    };
  }, [editorStatus, store]);

  // 交给外层：ref 直连，实例作用域
  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = store;
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, store]);

  const contextmenu = useMemo(() => proxy({
    id: '',
    x: 0,
    y: 0,
    open(id: string, x: number, y: number) {
      this.id = id;
      this.x = x;
      this.y = y;
    },
    close() {
      this.id = '';
    },
  }), [template_id])
  // 右键回调：打开全局单例菜单
  // 目标 id 从 handle 元素上读：NodeWrapper 的 nodeHandleRef 会给 .node-handle
  // 注入 data-node-id；万一某些组件把右键挂到了别处，再向上找最近的节点 root 兜底。
  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();  // 阻止冒泡到父节点
      const el = e.currentTarget as HTMLElement;
      const anchor = el.dataset?.nodeId
        ? el
        : (el.closest?.('[data-node-id]') as HTMLElement | null);
      const nodeId = anchor?.dataset?.nodeId || '';
      if (nodeId) {
        contextmenu.open(nodeId, e.clientX, e.clientY);
      }
    },
    [contextmenu]
  );

  const menuAction = useCallback((action: MenuAction) => {
    const id = action.nodeId;
    if (!id || !store.map.get(id)) return;

    if (action.kind === 'edit') {
      // 选中 → TemplateView 那边据此从树里取节点，交给 EditorPanel
      statusRef.current.editNodeId = id;
      statusRef.current.editNodeTab = action.tab || 'base';
      return;
    }

    if (action.kind === 'append') {
      if (!action.type) return;
      const parent = store.map.get(id);
      if (!parent) return;
      const node = store.createAndInsert(id, parent.children.length, action.type);
      if (node) {
        // 和旧版一致：新建完直接把编辑面板开到这个新节点上
        statusRef.current.editNodeId = node._id;
        statusRef.current.editNodeTab = 'base';
      }
      return;
    }

    if (action.kind === 'delete') {
      if (statusRef.current.editNodeId === id) statusRef.current.editNodeId = '';
      store.remove(id);
    }
  }, [store]);

  // ---------- 树根（template 壳）的选中框 ----------
  // rootId === template_id，也就是树的根就是下面那个壳 div —— 它没有 React 组件
  // 承载，走不了 NodeWrapper 那一套，所以这里单独盯 DOM 属性。
  // 用 effect + subscribe 而不是 state：标记跟着鼠标高频变化，
  // 走 state 会把整个 TView（连带画布上所有节点）重渲染。
  const shellRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const update = () => {
      const mark = mode !== 'edit' ? ''
        : editorStatus.currNodeId === store.rootId ? (editorStatus.dragging ? 'drag' : 'curr')
          : editorStatus.editNodeId === store.rootId ? 'edit'
            : '';
      if (el.dataset.mark === mark) return;
      if (mark) el.dataset.mark = mark;
      else delete el.dataset.mark;
    };
    update();
    return subscribe(editorStatus, update);
  }, [editorStatus, store, mode]);

  const rootNodes = store.rootId ? store.getChildren(store.rootId) : [];

  return <ModeContext.Provider value={mode}>
    <PageContext.Provider value={page}>
      <TreeContext.Provider value={store}>
        {/* 选中框（edit / curr / drag 三种配色）靠它驱动，NodeWrapper 消费 */}
        <EditorStatusContext.Provider value={editorStatus}>
          {/* 数据环境：source 快照 + query 域 + 写入通道。子树靠 <SourceScope> 覆盖 */}
          <DataEnvContext.Provider value={env}>
            <ContextMenuContext.Provider value={contextmenu}>
              <div
                ref={shellRef}
                // position: relative 是给选框的 ::after 当定位基准用的
                // （inline 的 display: flex 会盖掉 .node 里那条，这里不受影响）
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }}
                data-node-id={template_id}
              >
                {rootNodes.map(c => (
                  <NodeWrapper key={c._id} self={c} onContextMenu={onContextMenu} />
                ))}
                {mode === 'edit' && <ContextMenuContent contextmenu={contextmenu} onAction={menuAction} />}
                {store.loading && <Spin fullscreen spinning />}
              </div>
            </ContextMenuContext.Provider>
          </DataEnvContext.Provider>
        </EditorStatusContext.Provider>
      </TreeContext.Provider>
    </PageContext.Provider>
  </ModeContext.Provider>
}));

export const TemplateView = React.memo(function Template({ template_id, mode, path, close, status }: { template_id: string; mode: 'edit' | 'preview'; path: string; close: Function; status?: EditorStatus; }) {
  // 编辑器状态在「需要工具栏的那一层」创建，TView 和多实例共用不了同一个。
  // TemplateView 自己也要读 editNodeId 来渲染 EditorPanel，所以这里必须有兜底的那一份。
  const [ownStatus] = useState(() => createEditorStatus());
  const editorStatus = status ?? ownStatus;
  // 只订阅这两个值。status 里还有 currNodeId / dragging（鼠标划过高频变化），
  // 整体 useSnapshot 会让整个 TemplateView 连带 EditorPanel 跟着重渲染
  const editNodeId = useProxySelector(editorStatus, s => s.editNodeId) ?? '';
  const editNodeTab = useProxySelector(editorStatus, s => s.editNodeTab) ?? 'base';

  // canvas 既是 DragOverlay 的挂载点，也是 hitTest 的坐标原点，
  // 所以要在 store 之前声明，供 dragMove 使用
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // ---------- 拖拽预览 ----------
  // 被拖元素 DOM 的深拷贝，和它要挂进去的宿主节点。
  // 克隆体是原生 DOM，塞进 valtio proxy 会被包成 proxy 而炸掉，所以只能走 ref。
  const previewRef = useRef<HTMLElement | null>(null);
  const previewHostRef = useRef<HTMLDivElement | null>(null);

  // TView 挂载后把树 store 交到这里（实例作用域，不走全局事件）
  const treeRef = useRef<TreeStoreInstance | null>(null);

  const [editorState, editorStore] = useLocalProxy({

    // 拖拽界面部分
    activeId: '',
    /** 正在拖的东西的类型（palette 项就是它自己的 type，画布节点取节点的 type）。拖放约束按它判定 */
    dragType: '',
    drop: null as { containerId: string; index: number } | null,
    containers: [] as ContainerInfo[],
    blocked: new Set<string>(),
    canvasBase: { left: 0, top: 0 },
    get indicator() {
      if (!this.drop) return null;
      const c = this.containers.find((x: ContainerInfo) => x.id === this.drop!.containerId);
      return c ? getIndicatorRect(c, this.drop.index) : null;
    },

    dragStart(event: DragStartEvent) {
      const id = String(event.operation.source?.id);
      this.activeId = id;

      // 抓一份源元素的 DOM 克隆当预览。
      // source.element 就是「发起拖拽的那个元素」——画布节点是它的根 div
      // （NodeWrapper 把 useDraggable 的 ref 挂在 bindings.root 上），
      // 组件库里的项就是 palette-item。两者同一条路径，不用分开处理。
      previewRef.current = createDragPreview(event.operation.source?.element);

      // 进入拖拽态：currNodeId 的配色从「悬停(天蓝)」切成「落点(淡黄)」，
      // 旧的悬停值先清掉，免得拖拽还没移动时残留一个悬停框
      editorStatus.dragging = true;
      editorStatus.currNodeId = '';

      const tree = treeRef.current;
      if (id.startsWith(PALETTE_PREFIX)) {
        // 从组件库拖入：不屏蔽任何容器，类型就是 palette 后面的那段
        this.blocked = new Set();
        this.dragType = id.slice(PALETTE_PREFIX.length);
      } else {
        // 从画布拖出：屏蔽自身 + 所有后代
        this.blocked = tree ? new Set(tree.collectSubtree(id)) : new Set();
        this.dragType = tree?.getNode(id)?.type ?? '';
      }

      // 两阶段测量：
      // 1) rAF 后先测一次，尽量贴近"按下瞬间"的布局
      // 2) gap 过渡结束后再测一次，得到最终布局
      requestAnimationFrame(() => {
        measure();
        window.setTimeout(measure, GAP_TRANSITION_MS);
      });
    },
    dragMove(event: DragMoveEvent) {
      // ⚠️ 不能读 event.operation.position.delta。
      // DragOperation.snapshot() 里是 `position: snapshot(this.position)`，
      // 而 snapshot() 只做 for...in 浅拷贝（仅可枚举属性）；delta / initial 是
      // Position 原型上的 class getter（不可枚举），拷贝后被丢掉 → undefined。
      // 剩下的是 { defaultValue, velocity, current }。
      //
      // event.to 和 position.current 都是视口坐标（底层 getEventCoordinates
      // 取的就是 clientX / clientY）。而 hitTest 需要的是相对 canvas 左上角的
      // 坐标（measureContainers 把一切归一化到 getRelativeRect(el, canvas)），
      // 所以这里要减去 canvas 的 boundingClientRect。
      const point = event.to ?? event.operation.position.current;
      const canvas = canvasRef.current;
      if (!point || !canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = point.x - rect.left;
      const y = point.y - rect.top;

      const tree = treeRef.current;
      const id = this.activeId;
      // 拖放约束：不接收这种子节点的容器被跳过，判定往祖先容器落
      const canDrop = tree
        ? (containerId: string) => tree.canAccept(containerId, this.dragType)
        : undefined;

      const raw = hitTest(
        this.containers,
        x,
        y,
        this.blocked,
        { canDrop },
      );
      if (!raw || !id) {
        if (this.drop !== null) this.drop = null;
        if (editorStatus.currNodeId !== '') editorStatus.currNodeId = '';
        return;
      }
      // 画布内节点：等价于原地不动的落点视为无效
      if (!id.startsWith(PALETTE_PREFIX) && tree && tree.isNoopDrop(id, raw)) {
        if (this.drop !== null) this.drop = null;
        if (editorStatus.currNodeId !== '') editorStatus.currNodeId = '';
        return;
      }

      const prev = this.drop;
      const same =
        prev !== null &&
        prev.containerId === raw.containerId &&
        prev.index === raw.index;

      if (!same) {
        this.drop = raw;
        // 落点容器自己把「淡黄」画在自个儿身上，不再由画布盖一层
        // hitTest 算出来的矩形 —— 那个对 Table / GridLayout 这类
        // 自定义子结构框不准
        if (editorStatus.currNodeId !== raw.containerId) {
          editorStatus.currNodeId = raw.containerId;
        }
      }
    },
    dragReset() {
      this.activeId = '';
      this.dragType = '';
      this.drop = null;
      // 预览的克隆体只活一次拖拽；下次 dragStart 会重新抓一份
      // （节点的 DOM 可能在两次拖拽之间变过，不能复用旧的）
      previewRef.current = null;
      this.containers = [];
      this.blocked = new Set();
      // 退出拖拽态。currNodeId 一并清掉：拖拽结束后鼠标常常还停在原地不动，
      // 不清就会一直挂着那个淡黄框
      editorStatus.dragging = false;
      editorStatus.currNodeId = '';
    },
    dragEnd() {
      const id = editorStore.activeId;
      const target = editorStore.drop;
      const tree = treeRef.current;

      if (id && target && tree) {
        // 落点已经过 canAccept 过滤，这里再判一次兜底（drop 可能是上一帧留下的）
        if (!tree.canAccept(target.containerId, editorStore.dragType)) {
          this.dragReset();
          return;
        }
        if (id.startsWith(PALETTE_PREFIX)) {
          // 来自组件库：按 type 新建节点（新节点 id 由 createNode 生成 uuid v7）
          const node = tree.createAndInsert(target.containerId, target.index, id.slice(PALETTE_PREFIX.length));
          // 和旧版一致：新建完直接把编辑面板开到新节点上
          if (node) editorStatus.editNodeId = node._id;
        } else if (!tree.isNoopDrop(id, target)) {
          // 来自画布 → 移动
          tree.move(id, target.containerId, target.index);
        }
      }
      this.dragReset();
    },
  })

  // 从 TView 交过来的树 store 上读树。
  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    const tree = treeRef.current;
    if (!canvas || !tree) return;
    const root = tree.getNode(tree.rootId);
    if (!root) return;
    const cs = measureContainers(root as any, canvas, tree.getChildren);
    editorStore.containers = cs;
    const r = canvas.getBoundingClientRect();
    editorStore.canvasBase = { left: r.left, top: r.top };
  }, []);

  /**
   * 把拖拽预览的克隆体挂进 DragOverlay。
   *
   * 这里**故意不写依赖数组**：宿主 div 是 DragOverlay 的 children，
   * 而它只在「有 source」时才会渲染出来 —— 宿主挂载和「dragStart 里抓克隆」
   * 不在同一个 effect 周期里。每次 commit 都试挂一遍最稳：
   * 宿主一出现就挂上，已经挂好（firstChild 就是它）就直接跳过，开销可以忽略。
   *
   * 克隆体是原生 DOM，React 渲染不了，只能手动 appendChild。
   */
  useEffect(() => {
    const host = previewHostRef.current;
    const el = previewRef.current;
    if (!host || !el || host.firstChild === el) return;
    host.replaceChildren(el);
  });

  // 当前编辑的节点：只存 id，节点对象每次从树里取 ——
  // 取到的是 MST 节点实例，EditorPanel 是 observer，改数据面板能跟着刷新。
  const selectedNode = editNodeId && treeRef.current
    ? (treeRef.current.getNode(editNodeId) ?? null)
    : null;

  return (
    <>
      <DragDropProvider
        sensors={
          [
            PointerSensor.configure({
              activationConstraints: [
                new PointerActivationConstraints.Distance({ value: 8 })
              ],
            }),
          ]}
        // 迁移自旧版 CustomMouseSensor：命中 [data-no-dnd] 的元素不允许发起拖拽
        onBeforeDragStart={e => {
          if (!shouldHandleEvent(e.operation.source?.element ?? null)) {
            e.preventDefault();
          }
        }}
        onDragStart={e => editorStore.dragStart(e)}
        onDragMove={e => editorStore.dragMove(e)}
        onDragEnd={() => editorStore.dragEnd()}
      >
        <div className="app">
          {mode === 'edit' && <Palette types={store.component.types} loading={store.component.typesLoading} />}
          <div className='canvas' ref={canvasRef} style={{ boxShadow: 'inset 0 0 10px #1890ff' }}>
            <TView template_id={template_id} path={path} mode={mode} close={close} apiRef={treeRef} status={editorStatus} />
            {mode === 'edit' && editorState.indicator && (
              <div
                className="drop-indicator-wrap"
                style={{
                  left: editorState.indicator.left,
                  top: editorState.indicator.top,
                  width: editorState.indicator.width,
                  height: editorState.indicator.height,
                }}
              >
                {/* key 变化 → 内层重挂载 → pop 动画重播 */}
                <div
                  className="drop-indicator-inner"
                  key={`${editorState.drop!.containerId}:${editorState.drop!.index}`}
                />
              </div>
            )}
            {/* 拖拽落点的容器高亮不再由这里盖一层算出来的矩形，
                改由落点节点自己的 .node[data-mark='drag']::after 画 —— 
                Table / GridLayout 这类自定义子结构的实际边界只有节点自己知道 */}
          </div>
          {mode === 'edit' && selectedNode && <EditorPanel
            // 换节点就重挂载，面板里的 tab / 弹窗状态跟着重置
            key={selectedNode._id}
            node={selectedNode}
            tabKey={editNodeTab}
            onChange={(field, value) => {
              const id = editorStatus.editNodeId;
              if (id) treeRef.current?.setField(id, field, value);
            }}
            onClose={() => { editorStatus.editNodeId = ''; }}
          />}
          {/* 拖拽预览：内容是 dragStart 时克隆的源元素 DOM，
              由上面那个 effect 挂进这个宿主 div。
              dnd-kit 会把 overlay 自身定成和源元素一样大并跟着指针走，
              所以这里只需要一个撑满的宿主 + 让克隆体贴满它即可（样式见 styles.css） */}
          <DragOverlay dropAnimation={null}>
            <div ref={previewHostRef} className="drag-preview-host" />
          </DragOverlay>
        </div>
      </DragDropProvider>
    </>
  )
})
