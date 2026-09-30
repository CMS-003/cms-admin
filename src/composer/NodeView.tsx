import React, { memo, useCallback, useContext, useEffect, useRef } from 'react';
import { DndContext, DragEndEvent, DragMoveEvent, DragOverlay, DragStartEvent, PointerSensor, useDraggable, useSensor, useSensors } from '@dnd-kit/core';
import { ContextMenu, type MenuAction } from './ContextMenu';
import { IComponent, IPageInfo, ITemplate } from '@/types';
import { ModeContext, PageContext } from '../groups/context';
import apis from '@/api';
import store from '@/store';
import { Spin } from 'antd';
import { Palette } from './Palette';
import { EditorPanel } from './EditorPanel';
import { ContainerInfo, measureContainers, hitTest, getIndicatorRect } from './geometry';
import BaseNode from '../nodes/index'
import { useLocalProxy } from '@/utils/valtio';

const PALETTE_PREFIX = 'palette:';
const GAP_TRANSITION_MS = 220; // 略大于 CSS 里 gap 过渡的 200ms

const MemoNodeView = memo(function ComponentView({ self, mode }: { self: IComponent, mode: 'edit' | 'preview' }) {
  const Com = BaseNode[self.type as keyof typeof BaseNode];
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: self._id,
  });
  const handleMenuAction = useCallback((a: MenuAction) => {
    if (a.kind === 'append') {

    }
  }, []);
  if (Com) {
    return <ContextMenu node={self} template_id={self.template_id} onAction={handleMenuAction}>
      <Com self={self} drag={{ attributes, listeners, setNodeRef, isDragging }} mode={mode}>
        {self.children ? self.children.map(child => <MemoNodeView key={child._id} self={child} mode={mode} />) : null}
      </Com>
    </ContextMenu>
  } else {
    return <div>不支持</div>
  }
})

function NodeWrapper(props: any) {
  const mode = useContext(ModeContext);
  const page = useContext(PageContext);
  return <MemoNodeView {...props} mode={mode} page={page} />;
}


export const TemplateView = React.memo(function Template({ template_id, mode, path, close }: { template_id: string; mode: 'edit' | 'preview'; path: string; close: Function }) {

  const [page, pageProxy] = useLocalProxy<IPageInfo>(({
    template_id,
    path,
    param: {},
    query: Object.fromEntries(new URLSearchParams(path.split('?')[1])),
    setQuery(field, value) {
      this.query[field] = value;
    },
    close,
  }));
  const [editor, proxy] = useLocalProxy({
    template_id: '',
    template: null as ITemplate | null,
    loading: true,
    findNode(id: string, root?: ITemplate | IComponent): null | ITemplate | IComponent {
      if (!this.template) return null;
      if (!root) {
        root = this.template;
      }
      if (root._id === id) return root;
      if (!root.children) return null;
      for (const c of root.children) {
        const r = this.findNode(id, c)
        if (r) return r;
      }
      return null;
    },
    findParent(id: string, root?: ITemplate | IComponent): ITemplate | IComponent | null {
      if (!root) {
        root = this.template!;
      }
      if (!root.children) return null;
      for (const c of root.children) {
        if (c._id === id) return root;
        const p = this.findParent(id, c)
        if (p) return p;
      }
      return null;
    },
    /**
     * 该落点是否等价于「原地不动」
     * - 只有目标容器 == 当前父容器时才可能
     * - 同容器时，index == currentIndex 或 currentIndex + 1 都等于不动
     *   （+1 是因为：摘除当前节点后，它后面的空位填上来，再插回去就回到原位）
     */
    isNoopDrop(dragId: string, target: { containerId: string; index: number }) {
      const parent = this.findParent(dragId);
      if (!parent || !parent.children) return false;
      if (parent._id !== target.containerId) return false;

      const currentIndex = parent.children.findIndex((c) => c._id === dragId);
      if (currentIndex < 0) return false;

      return target.index === currentIndex || target.index === currentIndex + 1;
    },
    insertNode(parentId: string, index: number, node: IComponent) {
      const parent = this.findParent(parentId);
      if (!parent) return;
      const i = Math.max(0, Math.min(index, parent.children.length));
      parent.children.splice(i, 0, node)
    },
    removeNode(id: string) {
      const parent = this.findParent(id)
      if (!parent) return;
      const idx = parent.children.findIndex(c => c._id === id);
      if (idx >= 0) {
        parent.children.splice(idx, 1)
      }
    },



    activeId: '',
    drop: null as { containerId: string; index: number } | null,
    selectedId: '' as string | null,
    containers: [] as ContainerInfo[],
    blocked: new Set<string>(),
    canvasBase: { left: 0, top: 0 },
    get selectedNode() {
      return this.selectedId ? this.findNode(this.selectedId) : null;
    },

    get activeNode() {
      if (!this.activeId) return null;
      if (this.activeId.startsWith(PALETTE_PREFIX)) {
        // TODO: insert
        // return createNodeByType(
        //   activeId.slice(PALETTE_PREFIX.length) as NodeType
        // );
      }
      return this.findNode(this.activeId);
    },
    get indicator() {
      if (!this.drop) return null;
      const c = this.containers.find((x: ContainerInfo) => x.id === this.drop!.containerId);
      return c ? getIndicatorRect(c, this.drop.index) : null;
    },

    get dropContainer() {
      if (!this.drop) return null;
      return this.containers.find((c: ContainerInfo) => c.id === this.drop!.containerId) ?? null;
    },
  })

  const refreshTemplateDetail = useCallback(async () => {
    try {
      if (!proxy.template_id) return;
      proxy.loading = true
      const resp = await apis.getTemplateComponents(proxy.template_id)
      proxy.template = resp.data;
      proxy.loading = false;
    } catch (err) {
      proxy.loading = false;
      console.log(err)
    }
  }, [proxy.template_id])

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !proxy.template) return;
    const cs = measureContainers(proxy.template, canvas);
    proxy.containers = cs;
    const r = canvas.getBoundingClientRect();
    proxy.canvasBase = { left: r.left, top: r.top };
  }, []);

  const reset = useCallback(() => {
    proxy.activeId = '';
    proxy.drop = null;
    proxy.containers = [];
    proxy.blocked = new Set();
  }, []);

  // ---------- 拖动开始 ----------
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      // 保险：不管什么原因，锁定节点不允许进入拖拽流程
      if (!id.startsWith(PALETTE_PREFIX) && proxy.template) {
        const n = proxy.findNode(id);
        // TODO:
        // if (n&& n.draggable === false) {
        //   reset();
        //   return;
        // }
      }

      proxy.activeId = id;

      if (id.startsWith(PALETTE_PREFIX)) {
        // 从组件库拖入：不屏蔽任何容器
        proxy.blocked = new Set();
      } else {
        // 从画布拖出：屏蔽自身 + 所有后代
        const dragged = proxy.findNode(id);
        const blocked = new Set<string>();
        if (dragged) {
          const collect = (n: IComponent | ITemplate) => {
            blocked.add(n._id);
            n.children?.forEach(collect);
          };
          collect(dragged);
        }
        proxy.blocked = blocked;
      }

      // 两阶段测量：
      // 1) rAF 后先测一次，尽量贴近"按下瞬间"的布局
      // 2) gap 过渡结束后再测一次，得到最终布局
      requestAnimationFrame(() => {
        measure();
        window.setTimeout(measure, GAP_TRANSITION_MS);
      });
    },
    [measure]
  );

  // ---------- 拖动中 ----------
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ae = event.activatorEvent as PointerEvent;
    const { left, top } = proxy.canvasBase;
    const x = ae.clientX + event.delta.x - left;
    const y = ae.clientY + event.delta.y - top;

    const raw = hitTest(
      proxy.containers,
      x,
      y,
      proxy.blocked,
    );
    // 画布内节点：等价于原地不动的落点视为无效
    const id = proxy.activeId;
    const hit =
      raw &&
        id &&
        !id.startsWith(PALETTE_PREFIX) &&
        proxy.isNoopDrop(id, raw)
        ? null
        : raw;

    const prev = proxy.drop;
    const same =
      (prev === null && hit === null) ||
      (prev !== null &&
        hit !== null &&
        prev.containerId === hit.containerId &&
        prev.index === hit.index);

    if (!same) {
      proxy.drop = hit;
    }
  }, []);

  // ---------- 拖动结束 ----------
  const handleDragEnd = useCallback(
    (_event: DragEndEvent) => {
      const id = proxy.activeId;
      const target = proxy.drop;

      if (id && target) {
        if (id.startsWith(PALETTE_PREFIX)) {
          // 来自组件库 → 新建节点并插入
          // const type = id.slice(PALETTE_PREFIX.length) as NodeType;
          // TODO: insert
          // const node = createNodeByType(type);
          // setTree((prev) =>
          //   insertNode(prev, target.containerId, target.index, node)
          // );
        } else if (!proxy.isNoopDrop(id, target)) {
          // 来自画布 → 移动
          // setTree((prev) =>
          //   prev && moveNode(prev, id, target.containerId, target.index)
          // );
        }
      }
      reset();
    },
    [reset]
  );

  const handleDragCancel = useCallback(() => reset(), [reset]);

  useEffect(() => {
    if (template_id && template_id !== proxy.template_id) {
      proxy.template_id = template_id
      refreshTemplateDetail()
    }
  }, [template_id])

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="app">
        <Palette types={store.component.types} loading={store.component.typesLoading} />
        <ModeContext.Provider value={mode}>
          <div className='canvas' ref={canvasRef}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, boxShadow: '0 0 10px #1890ff', overflow: 'auto' }} data-node-id={template_id}>
              {editor.template ? editor.template.children.map(c => (
                <NodeWrapper
                  key={c._id}
                  self={c}
                />
              )) : null}
            </div>
            {editor.indicator && (
              <div
                className="drop-indicator-wrap"
                style={{
                  left: editor.indicator.left,
                  top: editor.indicator.top,
                  width: editor.indicator.width,
                  height: editor.indicator.height,
                }}
              >
                {/* key 变化 → 内层重挂载 → pop 动画重播 */}
                <div
                  className="drop-indicator-inner"
                  key={`${editor.drop!.containerId}:${editor.drop!.index}`}
                />
              </div>
            )}
            {/* 背景 */}
            {editor.dropContainer && (
              <div
                className="drop-container-highlight"
                style={{
                  left: editor.dropContainer.rect.left,
                  top: editor.dropContainer.rect.top,
                  width: editor.dropContainer.rect.width,
                  height: editor.dropContainer.rect.height,
                }}
              />
            )}
          </div>
          <EditorPanel
            node={proxy.selectedNode}
            onChange={(patch) => {
              // if (selectedId) setTree((prev) => prev && updateNode(prev, selectedId, patch));
            }}
            onClose={() => proxy.selectedId = ''}
          />
          {/* 预览 */}
          <DragOverlay dropAnimation={null}>
            {
              editor.activeNode
                ? <div style={{ opacity: 0.7, backgroundColor: '#ccc', transform: 'translate(0,49%)' }}>
                  <NodeWrapper self={editor.activeNode} />
                </div>
                : null
            }
          </DragOverlay>
        </ModeContext.Provider>
        {editor.loading && <Spin fullscreen spinning />}
      </div>
    </DndContext>
  )
})