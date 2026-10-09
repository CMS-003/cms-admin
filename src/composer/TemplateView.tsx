import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DragMoveEvent, DragOverlay, DragStartEvent, DragDropProvider } from '@dnd-kit/react';
import { ContextMenuContent, ContextMenuContext } from './ContextMenu';
import { PointerSensor, PointerActivationConstraints } from '@dnd-kit/dom';
import { FlatNode, IPageInfo, IWidget } from '@/types';
import { ModeContext, PageContext } from '../groups/context';
import apis from '@/api';
import store from '@/store';
import { message, Spin } from 'antd';
import { Palette } from './Palette';
import { NodeWrapper } from './NodeWrapper';
import { EditorPanel } from './EditorPanel';
import { ContainerInfo, measureContainers, hitTest, getIndicatorRect } from './geometry';
import { TreeContext } from './TreeContext';
import {
  DropTarget,
  TreeApi,
  TreeData,
  collectChanges,
  collectSubtreeIds,
  createNode,
  getSiblingIndexIn,
  insertIntoMap,
  isNodeChanged,
  isNoopDropIn,
  moveInMap,
  normalizeTree,
  reindexInMap,
  refreshSubtreeTreeIds,
  removeFromMap,
} from './tree';
import { canAcceptType, typeAccepts } from './componentTypes';
import { EditorStatus, createEditorStatus } from './status';

import { useLocalProxy } from '@/utils/valtio';
import { proxy, useSnapshot } from 'valtio';
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
  /**
   * 编辑器状态（脏数据数量 / 保存 / 当前编辑节点）。由需要工具栏的那一层创建后传进来；
   * 独立渲染 TView 时不传，内部自己造一个。
   */
  status?: EditorStatus;
};

export const TView = React.memo(function T({ template_id, mode, path, close, apiRef, status }: TViewProps) {
  // 编辑器状态要在 store 之前解析：store 里的 action（右键菜单等）要写它，
  // 而 action 是在首次渲染时就创建好的闭包。用 ref 读，避免闭包捕获到旧对象。
  const [ownStatus] = useState(() => createEditorStatus());
  const editorStatus = status ?? ownStatus;
  const statusRef = useRef(editorStatus);
  statusRef.current = editorStatus;

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
    // ---------- 组件树：扁平存储，所有节点在 map 里，children 存 id 列表 ----------
    template_id: '',
    rootId: '',
    map: {} as Record<string, FlatNode>,
    loading: true,

    // ---------- 变更追踪 ----------
    /** 待提交的变更节点 id（新增 + 修改） */
    dirtyIds: [] as string[],
    /** 待提交删除的节点 id。$new 的节点没落过库，删除时直接丢弃，不会进这里 */
    removedIds: [] as string[],
    saving: false,

    /** 重算单个节点的变更状态。写接口改完数据都要调它，dirtyIds 才不会漏。 */
    recache(id: string) {
      if (!id || id === editorStore.rootId) return;
      const node = editorStore.map[id];
      if (!node) return;
      const dirty = isNodeChanged(node as unknown as FlatNode);
      const i = editorStore.dirtyIds.indexOf(id);
      if (dirty && i === -1) {
        editorStore.dirtyIds = [...editorStore.dirtyIds, id];
      } else if (!dirty && i !== -1) {
        editorStore.dirtyIds = editorStore.dirtyIds.filter((x) => x !== id);
      }
    },
    recacheMany(ids: string[]) {
      ids.forEach((id) => editorStore.recache(id));
    },

    // ---------- 读（逻辑用，从 live store 读，不参与渲染依赖）----------
    getSiblingIndex(id: string) {
      return getSiblingIndexIn(editorStore.map, id);
    },
    collectSubtree(id: string) {
      return collectSubtreeIds(editorStore.map, id);
    },
    isNoopDrop(dragId: string, target: DropTarget) {
      return isNoopDropIn(editorStore.map, dragId, target);
    },

    // ---------- 写 ----------
    // 树的结构语义全在 tree.ts 的纯函数里（children / parent_id 双写也在那收口），
    // 这里只负责在改完之后补「变更簿记」。
    insertAt(parentId: string, index: number, node: FlatNode) {
      if (!insertIntoMap(editorStore.map, parentId, index, node)) return;
      // 新节点必须重算（$new 恒为脏）；被挤到后面的兄弟 order 变了也要重算
      editorStore.recache(node._id);
      editorStore.recacheMany(reindexInMap(editorStore.map, parentId));
      // createNode 已经按规则写好 tree_id，这里兜一层，防止外部塞进来的节点带错值
      editorStore.recacheMany(refreshSubtreeTreeIds(editorStore.map, node._id, parentId));
    },
    remove(id: string) {
      const node = editorStore.map[id];
      if (!node) return;
      const parentId = node.parent_id;
      const subtree = collectSubtreeIds(editorStore.map, id);
      // 先记账（removeFromMap 之后这些节点就查不到了）：
      // $new 的还没进数据库，直接丢弃；其它节点待删除，保存时一起提交
      for (const nid of subtree) {
        if (nid === editorStore.rootId) continue;
        const n = editorStore.map[nid];
        if (n && !n.$new && editorStore.removedIds.indexOf(nid) === -1) {
          editorStore.removedIds = [...editorStore.removedIds, nid];
        }
      }
      removeFromMap(editorStore.map, id);
      editorStore.dirtyIds = editorStore.dirtyIds.filter((d) => subtree.indexOf(d) === -1);
      // 剩下的兄弟 order 前移了
      editorStore.recacheMany(reindexInMap(editorStore.map, parentId));
    },
    move(id: string, parentId: string, index: number) {
      const containers = moveInMap(editorStore.map, id, parentId, index);
      if (!containers.length) return;
      // 两边容器的 order 都要重排
      for (const cid of containers) {
        editorStore.recacheMany(reindexInMap(editorStore.map, cid));
      }
      // 换了所属的一级子树时，整棵子树的 tree_id 都要跟着改
      editorStore.recacheMany(refreshSubtreeTreeIds(editorStore.map, id, parentId));
      // 跨容器时被移动节点的 parent_id 变了，但它的 order / tree_id 值未必变，
      // 所以不能只依赖上面那两轮，得单独再算一次
      editorStore.recache(id);
    },
    setField(id: string, key: string, value: any) {
      const n = editorStore.map[id];
      if (!n) return;
      set(n, key, value);
      editorStore.recache(id);
    },

    // ---------- 新建 ----------
    createAndInsert(parentId: string, index: number, type: string) {
      const parent = editorStore.map[parentId];
      if (!parent) return null;
      // 拖放约束对「新增」同样生效。root 是页面壳，不做约束
      if (parentId !== editorStore.rootId
        && !canAcceptType(parent.type, (parent as any).accepts, type)) {
        message.warning(`「${parent.title || parent.type}」不接收「${type}」类型的子节点`);
        return null;
      }
      const node = createNode({
        type,
        parent: parent as unknown as FlatNode,
        parentIsRoot: parentId === editorStore.rootId,
        index,
        template_id: editorStore.template_id || parent.template_id,
        project_id: parent.project_id,
        accepts: typeAccepts(type) ?? [],
      });
      editorStore.insertAt(parentId, index, node);
      return node;
    },

    // ---------- 保存 ----------
    async save() {
      if (editorStore.saving) return;
      const updates = collectChanges({ rootId: editorStore.rootId, map: editorStore.map });
      const removes = editorStore.removedIds.slice();
      if (!updates.length && !removes.length) return;

      editorStore.saving = true;
      try {
        if (updates.length) {
          await apis.batchUpdateComponent({ body: updates });
        }
        if (removes.length) {
          await apis.batchDestroyComponent({ ids: removes.join(',') });
        }
        // 提交成功 → 就地重置基线。
        // 不重新拉取：拉取会把选中态、滚动位置、$selected 全冲掉，
        // 而且本地数据本来就是权威的（只缺后端补的 updatedAt）。
        for (const p of updates) {
          const n = editorStore.map[p._id];
          if (!n) continue;
          n.$origin = cloneDeep(p);   // 必须深拷贝：p 里的 attrs / style 还是活引用
          n.$new = false;
        }
        editorStore.dirtyIds = [];
        editorStore.removedIds = [];
      } catch (err: any) {
        message.error(`保存失败：${err?.message || err}`);
        throw err;
      } finally {
        editorStore.saving = false;
      }
    },

    // ---------- 表单数据 ----------
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
      editorStore.setField(id, key, value);
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

    // ---------- 右键菜单 ----------
    menuAction(action: { kind: string; nodeId: string; type?: string; tab?: string }) {
      const id = action.nodeId;
      if (!id || !editorStore.map[id]) return;

      if (action.kind === 'edit') {
        // 选中 → TemplateView 那边据此从树里取节点，交给 EditorPanel
        statusRef.current.editNodeId = id;
        statusRef.current.editNodeTab = action.tab || 'base';
        return;
      }

      if (action.kind === 'append') {
        if (!action.type) return;
        const parent = editorStore.map[id];
        const node = editorStore.createAndInsert(id, parent.children.length, action.type);
        if (node) {
          // 和旧版一致：新建完直接把编辑面板开到这个新节点上
          statusRef.current.editNodeId = node._id;
          statusRef.current.editNodeTab = 'base';
        }
        return;
      }

      if (action.kind === 'delete') {
        if (statusRef.current.editNodeId === id) statusRef.current.editNodeId = '';
        editorStore.remove(id);
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
    canAccept: (containerId, childType) => {
      if (!childType) return true;
      const s = stateRef.current;
      // root 是 template 本身（页面壳），不在组件类型表里，不做约束
      if (containerId === s.rootId) return true;
      const parent = s.map[containerId] as unknown as FlatNode | undefined;
      if (!parent) return false;
      return canAcceptType(parent.type, parent.accepts, childType);
    },
    isDirty: (id) => editorStore.dirtyIds.indexOf(id) !== -1,
    getDirtyIds: () => editorStore.dirtyIds.slice(),
    getRemovedIds: () => editorStore.removedIds.slice(),
    insertAt: (parentId, index, node) => editorStore.insertAt(parentId, index, node),
    remove: (id) => editorStore.remove(id),
    move: (id, parentId, index) => editorStore.move(id, parentId, index),
    setField: (id, key, value) => editorStore.setField(id, key, value),
    createAndInsert: (parentId, index, type) => editorStore.createAndInsert(parentId, index, type),
    save: () => editorStore.save(),
  }), [editorStore]);

  // 交给外层：ref 直连，实例作用域
  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = api;
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, api]);

  // ---------- 编辑器状态同步（工具栏保存按钮靠这个）----------
  useEffect(() => {
    editorStatus.save = () => editorStore.save();
    return () => {
      editorStatus.save = async () => { };
    };
  }, [editorStatus, editorStore]);

  useEffect(() => {
    editorStatus.dirtyCount = editorState.dirtyIds.length + editorState.removedIds.length;
  }, [editorStatus, editorState.dirtyIds.length, editorState.removedIds.length]);

  useEffect(() => {
    editorStatus.saving = editorState.saving;
  }, [editorStatus, editorState.saving]);

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
      // normalizeTree 一次性把 $origin 基线、order、tree_id、accepts 归一化
      const data: TreeData = normalizeTree(resp.data as any, typeAccepts);
      editorStore.rootId = data.rootId;
      editorStore.map = data.map;
      editorStore.dirtyIds = [];
      editorStore.removedIds = [];
      // 换页/刷新后原来编辑的节点已经不存在了，别留着 id 指向空气
      statusRef.current.editNodeId = '';
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

export const TemplateView = React.memo(function Template({ template_id, mode, path, close, status }: { template_id: string; mode: 'edit' | 'preview'; path: string; close: Function; status?: EditorStatus; }) {
  // 编辑器状态在「需要工具栏的那一层」创建，TView 和多实例共用不了同一个。
  // TemplateView 自己也要读 editNodeId 来渲染 EditorPanel，所以这里必须有兜底的那一份。
  const [ownStatus] = useState(() => createEditorStatus());
  const editorStatus = status ?? ownStatus;
  const statusSnap = useSnapshot(editorStatus);

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

  // 当前编辑的节点：只存 id，节点对象每次从树里取 ——
  // 取到的是树 store 里的节点代理，EditorPanel 会订阅它，改数据面板能跟着刷新。
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
