import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { DragMoveEvent, DragOverlay, DragStartEvent, DragDropProvider } from '@dnd-kit/react';
import { ContextMenuContent, ContextMenuContext } from './ContextMenu';
import { PointerSensor, PointerActivationConstraints } from '@dnd-kit/dom';
import { FlatNode, IPageInfo, IWidget } from '@/types';
import { ModeContext, PageContext } from '../groups/context';
import apis from '@/api';
import store from '@/store';
import { Spin } from 'antd';
import { Palette } from './Palette';
import { NodeWrapper } from './NodeWrapper';
import { EditorPanel } from './EditorPanel';
import { ContainerInfo, measureContainers, hitTest, getIndicatorRect } from './geometry';
import { TreeContext } from './TreeContext';
import { DropTarget, TreeApi, TreeData, normalizeTree, resolveInsertIndex } from './tree';

import { useLocalProxy } from '@/utils/valtio';
import { proxy } from 'valtio';
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
   * 把树读写接口交给外层（TemplateView 拖拽用）。
   * 用 ref 直连而不是全局事件：TView 是多实例的（画布 / Tab 内嵌 / dynamic 页），
   * 全局事件会让三个实例互相串台。
   */
  apiRef?: React.MutableRefObject<TreeApi | null>;
};

export const TView = React.memo(function T({ template_id, mode, path, close, apiRef }: TViewProps) {
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

  const [editorState, editorStore] = useLocalProxy({
    // 组件树部分 —— 扁平存储：所有节点在 map 里，children 存 id 列表
    template_id: '',
    rootId: '',
    map: {} as Record<string, FlatNode>,
    loading: true,

    // ---------- 读（逻辑用，从 live store 读，不参与渲染依赖）----------
    getSiblingIndex(id: string) {
      const node = editorStore.map[id];
      if (!node) return -1;
      const parent = editorStore.map[node.parent_id];
      return parent ? parent.children.indexOf(id) : -1;
    },
    /** 自身 + 所有后代的 id */
    collectSubtree(id: string) {
      const out: string[] = [];
      const dfs = (nid: string) => {
        out.push(nid);
        const n = editorStore.map[nid];
        if (n) n.children.forEach(dfs);
      };
      dfs(id);
      return out;
    },
    /**
     * 该落点是否等价于「原地不动」
     * - 只有目标容器 == 当前父容器时才可能
     * - 同容器时，index == currentIndex 或 currentIndex + 1 都等于不动
     *   （+1 是因为：摘除当前节点后，它后面的空位填上来，再插回去就回到原位）
     */
    isNoopDrop(dragId: string, target: DropTarget) {
      const node = editorStore.map[dragId];
      if (!node) return false;
      if (node.parent_id !== target.containerId) return false;
      const siblings = editorStore.map[target.containerId]?.children;
      if (!siblings) return false;
      const currentIndex = siblings.indexOf(dragId);
      if (currentIndex < 0) return false;
      return target.index === currentIndex || target.index === currentIndex + 1;
    },

    // ---------- 写（唯一入口：children 与 parent_id 双写在这里收口）----------
    insertAt(parentId: string, index: number, node: FlatNode) {
      const parent = editorStore.map[parentId];
      if (!parent || !node || !node._id) return;
      // 跨 store 传进来的是普通对象，深拷贝一份再交给 valtio，避免外部引用被间接改写
      editorStore.map[node._id] = {
        ...cloneDeep(node),
        _id: node._id,
        parent_id: parentId,
        children: [],
      };
      const ids = parent.children.slice();
      ids.splice(Math.max(0, Math.min(index, ids.length)), 0, node._id);
      parent.children = ids;
    },
    remove(id: string) {
      const node = editorStore.map[id];
      if (!node) return;
      // 整棵子树一起摘掉
      for (const nid of editorStore.collectSubtree(id)) {
        delete editorStore.map[nid];
      }
      const parent = editorStore.map[node.parent_id];
      if (parent) {
        parent.children = parent.children.filter((c) => c !== id);
      }
    },
    move(id: string, parentId: string, index: number) {
      const node = editorStore.map[id];
      const to = editorStore.map[parentId];
      if (!node || !to) return;
      const sameContainer = node.parent_id === parentId;
      const from = editorStore.map[node.parent_id];
      const oldIndex = from ? from.children.indexOf(id) : -1;
      // 先摘除，注意 index 是「摘除之前」的兄弟列表里的落点
      if (from && oldIndex >= 0) {
        from.children = from.children.filter((c) => c !== id);
      }
      const target = resolveInsertIndex(sameContainer, oldIndex, index);
      const ids = to.children.slice();
      ids.splice(Math.max(0, Math.min(target, ids.length)), 0, id);
      to.children = ids;
      if (node.parent_id !== parentId) node.parent_id = parentId;
    },
    setField(id: string, key: string, value: any) {
      const n = editorStore.map[id];
      if (n) set(n, key, value);
    },

    // 表单数据部分
    source: {} as any,
    setDataField(widget: IWidget, value: any) {
      if (!widget.field) {
        return;
      }
      value = getWidgetValue(widget, value);
      if (isNil(value)) {
        return;
      }
      if (widget.query) {
        editorStore.setQuery(widget.field, value)
      } else {
        set(editorStore.source, widget.field, value)
      }
    },
    setNodeField(node: any, key: string, value: any) {
      // this 丢失了~~ 统一走 editorStore
      const id = typeof node === 'string' ? node : node && node._id;
      if (!id) return;
      const n = editorStore.map[id];
      if (n) {
        set(n, key, value)
      }
    },
    page: {
      template_id,
      path,
      close,
      param: {},
      query: {} as any,
    },
    setQuery(field: string, value: any) {
      const query = cloneDeep(editorStore.page.query);
      query[field] = value
      editorStore.page.query = query;
    },

    menuAction(action: { kind: string; nodeId: string }) {
      if (action.kind === 'edit') {

      }
    }
  })

  // 读接口必须读到「最新快照」，否则不会建立响应式依赖。
  // stateRef 在每次渲染时更新，api 本身是稳定引用（useMemo 只依赖 editorStore），
  // 这样 NodeWrapper 的 memo 不会被上下文身份变化打破。
  const stateRef = useRef(editorState);
  stateRef.current = editorState;

  const api = useMemo<TreeApi>(() => ({
    get rootId() {
      return stateRef.current.rootId;
    },
    getNode: (id) => stateRef.current.map[id] as unknown as FlatNode | undefined,
    getChildren: (id) => {
      const node = stateRef.current.map[id] as unknown as FlatNode | undefined;
      if (!node) return [];
      const out: FlatNode[] = [];
      for (const cid of node.children) {
        const child = stateRef.current.map[cid] as unknown as FlatNode | undefined;
        if (child) out.push(child);
      }
      return out;
    },
    getParent: (id) => {
      const node = stateRef.current.map[id] as unknown as FlatNode | undefined;
      if (!node || !node.parent_id) return undefined;
      return stateRef.current.map[node.parent_id] as unknown as FlatNode | undefined;
    },
    getSiblingIndex: (id) => editorStore.getSiblingIndex(id),
    collectSubtree: (id) => editorStore.collectSubtree(id),
    isNoopDrop: (id, target) => editorStore.isNoopDrop(id, target),
    insertAt: (parentId, index, node) => editorStore.insertAt(parentId, index, node),
    remove: (id) => editorStore.remove(id),
    move: (id, parentId, index) => editorStore.move(id, parentId, index),
    setField: (id, key, value) => editorStore.setField(id, key, value),
  }), [editorStore]);

  // 交给外层：ref 直连，实例作用域
  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = api;
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, api]);

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
  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();  // 阻止冒泡到父节点
      if (contextmenu) {
        const nodeId = (e.currentTarget as HTMLElement).dataset.nodeId;
        console.log(nodeId)
        contextmenu.open(nodeId || '', e.clientX, e.clientY);
      }
    },
    [contextmenu]
  );

  const refreshTemplateDetail = useCallback(async () => {
    try {
      if (!editorStore.template_id) return;
      editorStore.loading = true
      const resp = await apis.getTemplateComponents(editorStore.template_id)
      const data: TreeData = normalizeTree(resp.data as any);
      editorStore.rootId = data.rootId;
      editorStore.map = data.map;
      editorStore.loading = false;
    } catch (err) {
      editorStore.loading = false;
      console.log(err)
    }
  }, [editorStore.template_id])

  useEffect(() => {
    if (template_id && template_id !== editorStore.template_id) {
      editorStore.template_id = template_id
      refreshTemplateDetail()
    }
  }, [template_id])

  const rootNodes = editorState.rootId ? api.getChildren(editorState.rootId) : [];

  return <ModeContext.Provider value={mode}>
    <PageContext.Provider value={page}>
      <TreeContext.Provider value={api}>
        <ContextMenuContext.Provider value={contextmenu}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }} data-node-id={template_id}>
            {rootNodes.map(c => (
              <NodeWrapper
                key={c._id}
                self={c}
                setNodeField={editorStore.setNodeField}
                source={editorState.source}
                page={editorState.page}
                setQuery={editorStore.setQuery}
                setDataField={editorStore.setDataField}
                onContextMenu={onContextMenu}
              />
            ))}
            {mode === 'edit' && <ContextMenuContent contextmenu={contextmenu} onAction={editorStore.menuAction} />}
            {editorState.loading && <Spin fullscreen spinning />}
          </div>
        </ContextMenuContext.Provider>
      </TreeContext.Provider>
    </PageContext.Provider>
  </ModeContext.Provider>
});

export const TemplateView = React.memo(function Template({ template_id, mode, path, close }: { template_id: string; mode: 'edit' | 'preview'; path: string; close: Function; }) {
  const page = proxy<IPageInfo>(({
    template_id,
    path,
    close,
    param: {},
    query: {} as any,
    setQuery(field, value) {
      this.query[field] = value;
    },
  }));

  // canvas 既是 DragOverlay 的挂载点，也是 hitTest 的坐标原点，
  // 所以要在 store 之前声明，供 dragMove 使用
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // TView 挂载后把树读写接口交到这里（实例作用域，不走全局事件）
  const treeRef = useRef<TreeApi | null>(null);

  const [editorState, editorStore] = useLocalProxy({

    // 拖拽界面部分
    activeId: '',
    drop: null as { containerId: string; index: number } | null,
    selectedId: '' as string | null,
    containers: [] as ContainerInfo[],
    blocked: new Set<string>(),
    canvasBase: { left: 0, top: 0 },
    selectedNode: null as null | FlatNode,
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

      if (id.startsWith(PALETTE_PREFIX)) {
        // 从组件库拖入：不屏蔽任何容器
        this.blocked = new Set();
      } else {
        // 从画布拖出：屏蔽自身 + 所有后代
        const tree = treeRef.current;
        this.blocked = tree ? new Set(tree.collectSubtree(id)) : new Set();
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

      const raw = hitTest(
        this.containers,
        x,
        y,
        this.blocked,
      );
      const id = this.activeId;
      if (!raw || !id) {
        if (this.drop !== null) this.drop = null;
        return;
      }
      // 画布内节点：等价于原地不动的落点视为无效
      const tree = treeRef.current;
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
      this.drop = null;
      this.containers = [];
      this.blocked = new Set();
    },
    dragEnd() {
      const id = editorStore.activeId;
      const target = editorStore.drop;
      const tree = treeRef.current;

      if (id && target && tree) {
        if (id.startsWith(PALETTE_PREFIX)) {
          // TODO(第二步): 来自组件库 → 按 type 新建节点并 tree.insertAt(...)
        } else if (!tree.isNoopDrop(id, target)) {
          // 来自画布 → 移动
          tree.move(id, target.containerId, target.index);
        }
      }
      this.dragReset();
    },
    menuAction(action: { kind: string; nodeId: string }) {
      if (action.kind === 'edit') {
        editorStore.selectedId = action.nodeId
      }
    }
  })

  // 从 TView 交过来的 tree api 上读树。
  // 之前这里恒为空数组，是因为 template 在 TView 的 store 里、TemplateView 根本读不到；
  // 现在通过 apiRef 直连就没这个问题了。
  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    const tree = treeRef.current;
    if (!canvas || !tree) return;
    const root = tree.getNode(tree.rootId);
    if (!root) return;
    const cs = measureContainers(root, canvas, tree.getChildren);
    editorStore.containers = cs;
    const r = canvas.getBoundingClientRect();
    editorStore.canvasBase = { left: r.left, top: r.top };
  }, []);

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
            <TView template_id={template_id} path={path} mode={mode} close={close} apiRef={treeRef} />
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
          {mode === 'edit' && editorState.selectedNode && <EditorPanel
            node={editorState.selectedNode as unknown as FlatNode}
            tabKey='base'
            setNode={(field: string, value: any) => {
              const id = editorStore.selectedNode?._id;
              if (id) treeRef.current?.setField(id, field, value)
            }}
            onChange={(patch) => {
              // if (selectedId) setTree((prev) => prev && updateNode(prev, selectedId, patch));
            }}
            onClose={() => editorStore.selectedId = ''}
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
