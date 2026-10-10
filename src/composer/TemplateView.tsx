import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DragMoveEvent, DragOverlay, DragStartEvent, DragDropProvider } from '@dnd-kit/react';
import { ContextMenuContent, ContextMenuContext, MenuAction } from './ContextMenu';
import { PointerSensor, PointerActivationConstraints } from '@dnd-kit/dom';
import { FlatNode, IPageInfo, IWidget, INodeActions } from '@/types';
import { ModeContext, PageContext } from '../groups/context';
import apis from '@/api';
import store from '@/store';
import { message, Spin } from 'antd';
import { Palette } from './Palette';
import { NodeWrapper } from './NodeWrapper';
import { EditorPanel } from './EditorPanel';
import { ContainerInfo, measureContainers, hitTest, getIndicatorRect } from './geometry';
import { TreeContext } from './TreeContext';
import { normalizeTree } from './tree';
import { TreeStore, TreeStoreInstance } from './treeStore';
import { canAcceptType, typeAccepts } from './componentTypes';
import { EditorStatus, createEditorStatus } from './status';

import { useLocalProxy } from '@/utils/valtio';
import { proxy, useSnapshot } from 'valtio';
import { autorun } from 'mobx';
import { observer } from 'mobx-react';
import { getWidgetValue } from './utils';
import { cloneDeep, isNil, set } from 'lodash-es';

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

  const page = proxy<IPageInfo>(({
    template_id,
    path,
    close,
    param: {},
    query: {} as any,
    setQuery(field, value) {
      const query = cloneDeep(this.query);
      query[field] = value
      this.query = query;
    },
  }));

  // ---------- 方法合并成一个 actions 对象往下传 ----------
  // setNodeField 写树（store action）；setDataField / setQuery 是表单数据侧，
  // query 落 page proxy、其余落 store.source
  const actions = useMemo<INodeActions>(() => ({
    setNodeField(node: any, key: string, value: any) {
      const id = typeof node === 'string' ? node : node && node._id;
      if (id) store.setField(id, key, value);
    },
    setDataField(widget: IWidget, value: any) {
      if (!widget.field) {
        return;
      }
      value = getWidgetValue(widget, value);
      if (isNil(value)) {
        return;
      }
      if (widget.query) {
        page.setQuery(widget.field, value);
      } else {
        store.setSource(widget.field, value);
      }
    },
    setQuery(field: string, value: any) {
      page.setQuery(field, value);
    },
  }), [store, page]);

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

  const rootNodes = store.rootId ? store.getChildren(store.rootId) : [];

  return <ModeContext.Provider value={mode}>
    <PageContext.Provider value={page}>
      <TreeContext.Provider value={store}>
        <ContextMenuContext.Provider value={contextmenu}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }} data-node-id={template_id}>
            {rootNodes.map(c => (
              <NodeWrapper
                key={c._id}
                self={c}
                actions={actions}
                source={store.source}
                page={page}
                onContextMenu={onContextMenu}
              />
            ))}
            {mode === 'edit' && <ContextMenuContent contextmenu={contextmenu} onAction={menuAction} />}
            {store.loading && <Spin fullscreen spinning />}
          </div>
        </ContextMenuContext.Provider>
      </TreeContext.Provider>
    </PageContext.Provider>
  </ModeContext.Provider>
}));

export const TemplateView = React.memo(function Template({ template_id, mode, path, close, status }: { template_id: string; mode: 'edit' | 'preview'; path: string; close: Function; status?: EditorStatus; }) {
  // 编辑器状态在「需要工具栏的那一层」创建，TView 和多实例共用不了同一个。
  // TemplateView 自己也要读 editNodeId 来渲染 EditorPanel，所以这里必须有兜底的那一份。
  const [ownStatus] = useState(() => createEditorStatus());
  const editorStatus = status ?? ownStatus;
  const statusSnap = useSnapshot(editorStatus);

  // canvas 既是 DragOverlay 的挂载点，也是 hitTest 的坐标原点，
  // 所以要在 store 之前声明，供 dragMove 使用
  const canvasRef = useRef<HTMLDivElement | null>(null);

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
    activeNode: null as null | FlatNode,
    get indicator() {
      if (!this.drop) return null;
      const c = this.containers.find((x: ContainerInfo) => x.id === this.drop!.containerId);
      return c ? getIndicatorRect(c, this.drop.index) : null;
    },
    get dropContainer() {
      if (!this.drop) return null;
      return this.containers.find((c: ContainerInfo) => c.id === this.drop!.containerId) ?? null;
    },

    dragStart(event: DragStartEvent) {
      const id = String(event.operation.source?.id);
      this.activeId = id;

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
        return;
      }
      // 画布内节点：等价于原地不动的落点视为无效
      if (!id.startsWith(PALETTE_PREFIX) && tree && tree.isNoopDrop(id, raw)) {
        if (this.drop !== null) this.drop = null;
        return;
      }

      const prev = this.drop;
      const same =
        prev !== null &&
        prev.containerId === raw.containerId &&
        prev.index === raw.index;

      if (!same) {
        this.drop = raw;
      }
    },
    dragReset() {
      this.activeId = '';
      this.dragType = '';
      this.drop = null;
      this.containers = [];
      this.blocked = new Set();
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

  // 当前编辑的节点：只存 id，节点对象每次从树里取 ——
  // 取到的是 MST 节点实例，EditorPanel 是 observer，改数据面板能跟着刷新。
  const editNodeId = statusSnap.editNodeId;
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
            {/* 背景 */}
            {mode === 'edit' && editorState.dropContainer && (
              <div
                className="drop-container-highlight"
                style={{
                  left: editorState.dropContainer.rect.left,
                  top: editorState.dropContainer.rect.top,
                  width: editorState.dropContainer.rect.width,
                  height: editorState.dropContainer.rect.height,
                }}
              />
            )}
          </div>
          {mode === 'edit' && selectedNode && <EditorPanel
            // 换节点就重挂载，面板里的 tab / 弹窗状态跟着重置
            key={selectedNode._id}
            node={selectedNode}
            tabKey={statusSnap.editNodeTab}
            onChange={(field, value) => {
              const id = editorStatus.editNodeId;
              if (id) treeRef.current?.setField(id, field, value);
            }}
            onClose={() => { editorStatus.editNodeId = ''; }}
          />}
          {/* 预览 */}
          <DragOverlay dropAnimation={null}>
            {
              editorState.activeNode
                ? <div style={{ opacity: 0.7, backgroundColor: '#ccc', }}>
                  overlay
                </div>
                : null
            }
          </DragOverlay>
        </div>
      </DragDropProvider>
    </>
  )
})
