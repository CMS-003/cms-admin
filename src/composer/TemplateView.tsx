import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { DndContext, DragEndEvent, DragMoveEvent, DragOverlay, DragStartEvent, PointerSensor, useDraggable, useSensor, useSensors } from '@dnd-kit/core';
import { ContextMenuContent, ContextMenuContext } from './ContextMenu';
import { IComponent, IPageInfo, ITemplate, IWidget } from '@/types';
import { ModeContext, PageContext } from '../groups/context';
import apis from '@/api';
import store from '@/store';
import { Spin } from 'antd';
import { Palette } from './Palette';
import { NodeWrapper } from './NodeWrapper';
import { EditorPanel } from './EditorPanel';
import { ContainerInfo, measureContainers, hitTest, getIndicatorRect } from './geometry';

import { useLocalProxy } from '@/utils/valtio';
import { proxy } from 'valtio';
import { MouseSensor as LibMouseSensor } from '@dnd-kit/core';
import type { MouseEvent } from 'react';
import { getWidgetValue } from './utils';
import { isNil, set } from 'lodash-es';

function shouldHandleEvent(element: HTMLElement | null): boolean {
  let cur = element;
  while (cur) {
    if (cur.dataset && cur.dataset.noDnd) {
      return false;
    }
    cur = cur.parentElement;
  }
  return true;
}

export class CustomMouseSensor extends LibMouseSensor {
  static activators = [
    {
      eventName: 'onMouseDown' as const,
      handler: ({ nativeEvent: event }: MouseEvent) => {
        return shouldHandleEvent(event.target as HTMLElement);
      },
    },
  ];
}

const PALETTE_PREFIX = 'palette:';
const GAP_TRANSITION_MS = 220; // 略大于 CSS 里 gap 过渡的 200ms

export const TemplateView = React.memo(function Template({ template_id, mode, path, close }: { template_id: string; mode: 'edit' | 'preview'; path: string; close: Function }) {

  const page = proxy<IPageInfo>(({
    template_id,
    path,
    param: {},
    query: Object.fromEntries(new URLSearchParams(path.split('?')[1])),
    setQuery(field, value) {
      this.query[field] = value;
    },
    close,
  }));

  const [editorState, editorStore] = useLocalProxy({
    // 组件树部分
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
        page.setQuery(widget.field, value);
      } else {
        set(this.source, widget.field, value)
      }
    },
    setNodeField(node: ITemplate | IComponent, key: string, value: any) {
      // this 丢失了~~
      const n = editorStore.findNode(node._id);
      if (n) {
        set(n, key, value)
      }
    },
    // 拖拽界面部分
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

    dragStart(event: DragStartEvent) {
      const id = String(event.active.id);
      // 保险：不管什么原因，锁定节点不允许进入拖拽流程
      if (!id.startsWith(PALETTE_PREFIX) && this.template) {
        const n = this.findNode(id);
        // TODO:
        // if (n&& n.draggable === false) {
        //   reset();
        //   return;
        // }
      }

      this.activeId = id;

      if (id.startsWith(PALETTE_PREFIX)) {
        // 从组件库拖入：不屏蔽任何容器
        this.blocked = new Set();
      } else {
        // 从画布拖出：屏蔽自身 + 所有后代
        const dragged = this.findNode(id);
        const blocked = new Set<string>();
        if (dragged) {
          const collect = (n: IComponent | ITemplate) => {
            blocked.add(n._id);
            n.children?.forEach(collect);
          };
          collect(dragged);
        }
        this.blocked = blocked;
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
      const ae = event.activatorEvent as PointerEvent;
      const { left, top } = this.canvasBase;
      const x = ae.clientX + event.delta.x - left;
      const y = ae.clientY + event.delta.y - top;

      const raw = hitTest(
        this.containers,
        x,
        y,
        this.blocked,
      );
      // 画布内节点：等价于原地不动的落点视为无效
      const id = this.activeId;
      const hit =
        raw &&
          id &&
          !id.startsWith(PALETTE_PREFIX) &&
          this.isNoopDrop(id, raw)
          ? null
          : raw;

      const prev = this.drop;
      const same =
        (prev === null && hit === null) ||
        (prev !== null &&
          hit !== null &&
          prev.containerId === hit.containerId &&
          prev.index === hit.index);

      if (!same) {
        this.drop = hit;
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

      if (id && target) {
        if (id.startsWith(PALETTE_PREFIX)) {
          // 来自组件库 → 新建节点并插入
          // const type = id.slice(PALETTE_PREFIX.length) as NodeType;
          // TODO: insert
          // const node = createNodeByType(type);
          // setTree((prev) =>
          //   insertNode(prev, target.containerId, target.index, node)
          // );
        } else if (!editorStore.isNoopDrop(id, target)) {
          // 来自画布 → 移动
          // setTree((prev) =>
          //   prev && moveNode(prev, id, target.containerId, target.index)
          // );
        }
      }
      this.dragReset();
    },
    menuAction(action: { kind: string }) {

    }
  })
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
      editorStore.template = resp.data;
      editorStore.loading = false;
    } catch (err) {
      editorStore.loading = false;
      console.log(err)
    }
  }, [editorStore.template_id])

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(CustomMouseSensor)
  );

  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !editorStore.template) return;
    const cs = measureContainers(editorStore.template, canvas);
    editorStore.containers = cs;
    const r = canvas.getBoundingClientRect();
    editorStore.canvasBase = { left: r.left, top: r.top };
  }, []);

  useEffect(() => {
    if (template_id && template_id !== editorStore.template_id) {
      editorStore.template_id = template_id
      refreshTemplateDetail()
    }
  }, [template_id])

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={e => editorStore.dragStart(e)}
        onDragMove={e => editorStore.dragMove(e)}
        onDragEnd={() => editorStore.dragEnd()}
        onDragCancel={() => editorStore.dragReset()}
      >
        <div className="app">
          <Palette types={store.component.types} loading={store.component.typesLoading} />
          <ModeContext.Provider value={mode}>
            <PageContext.Provider value={page}>
              <div className='canvas' ref={canvasRef}>
                <ContextMenuContext.Provider value={contextmenu}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, boxShadow: '0 0 10px #1890ff', overflow: 'auto' }} data-node-id={template_id}>
                    {editorState.template ? editorState.template.children.map(c => (
                      <NodeWrapper
                        key={c._id}
                        self={c as IComponent}
                        setNodeField={editorStore.setNodeField}
                        source={editorState.source}
                        setDataField={editorStore.setDataField}
                        onContextMenu={onContextMenu}
                      />
                    )) : null}
                  </div>
                </ContextMenuContext.Provider>
                {editorState.indicator && (
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
                {editorState.dropContainer && (
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
              <EditorPanel
                node={editorStore.selectedNode}
                onChange={(patch) => {
                  // if (selectedId) setTree((prev) => prev && updateNode(prev, selectedId, patch));
                }}
                onClose={() => editorStore.selectedId = ''}
              />
              {/* 预览 */}
              <DragOverlay dropAnimation={null}>
                {
                  editorState.activeNode
                    ? <div style={{ opacity: 0.7, backgroundColor: '#ccc', }}>
                      <NodeWrapper self={editorState.activeNode} setNodeField={editorStore.setNodeField} source={editorState.source} setDataField={editorStore.setDataField} />
                    </div>
                    : null
                }
              </DragOverlay>
            </PageContext.Provider>
          </ModeContext.Provider>
          {editorState.loading && <Spin fullscreen spinning />}
        </div>
      </DndContext>
      {/* 单例菜单层：全局仅此一个 */}
      <ContextMenuContent contextmenu={contextmenu} onAction={editorStore.menuAction} />
    </>
  )
})