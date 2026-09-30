import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, DragEndEvent, DragMoveEvent, DragOverlay, DragStartEvent, PointerSensor, useDraggable, useSensor, useSensors } from '@dnd-kit/core';
import { ContextMenu, type MenuAction } from './ContextMenu';
import { IComponent, IPageInfo, ITemplate } from '@/types';
import { ModeContext, PageContext, useModeContext, useSetTitleContext } from '../groups/context';
import { Observer, useLocalObservable } from 'mobx-react';
import apis from '@/api';
import store from '@/store';
import { Spin } from 'antd';
import { Palette } from './Palette';
import { EditorPanel } from './EditorPanel';
import { ContainerInfo, DropTarget, measureContainers, hitTest, getIndicatorRect } from './geometry';
import { removeNode, findNode, isNoopDrop, NodeType, moveNode, updateNode } from './tree';
import { Component } from '@/store/component';
import BaseNode from '../nodes/index'

const PALETTE_PREFIX = 'palette:';
const GAP_TRANSITION_MS = 220; // 略大于 CSS 里 gap 过渡的 200ms
const HIT_OPTS = {
  edgeRatio: 0.22,   // 交叉轴边缘带宽度，控制"让给父容器"的敏感度
  midRatio: 0.5,     // 主轴二分点，控制"内部 index 切换"的敏感度
};

/** 拖动预览（不挂 useDraggable，纯展示） */
function DragPreview({ node }: { node: ITemplate | IComponent }) {
  return (
    <div style={{ opacity: 0.7, backgroundColor: '#ccc', transform: 'translate(0,49%)' }}>
      <NodeWrapper self={node} />
    </div>
  );
}

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

  const page = useLocalObservable<IPageInfo>(() => ({
    template_id,
    path,
    param: {},
    query: Object.fromEntries(new URLSearchParams(path.split('?')[1])),
    setQuery(field, value) {
      this.query[field] = value;
    },
    close,
  }));
  const local = useLocalObservable(() => ({
    template_id: '',
    template: null as ITemplate | null,
    loadingTemplate: false,
    setLoadingTemplate(bool: boolean) {
      this.loadingTemplate = bool;
    },
    setTemplate(template: ITemplate) {
      this.template = template;
    },
    setTemplateId(id: string) {
      this.template_id = id;
    },
  }))

  const refreshTemplateDetail = useCallback(async () => {
    try {
      if (!local.template_id) return;
      local.setLoadingTemplate(true)
      const resp = await apis.getTemplateComponents(local.template_id)
      const { children, ...template } = resp.data;
      console.log(resp)
      local.setTemplate({
        ...template,
        children: children.map(child => Component.create(child))
      })
      local.setLoadingTemplate(false)
    } catch (err) {
      local.setLoadingTemplate(false)
      console.log(err)
    }
  }, [local.template_id])

  const [activeId, setActiveId] = useState<string | null>(null);
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [drop, setDrop] = useState<DropTarget | null>(null);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const canvasBaseRef = useRef({ left: 0, top: 0 });
  const containersRef = useRef<ContainerInfo[]>([]);
  const dropRef = useRef<DropTarget | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const blockedRef = useRef<Set<string>>(new Set());

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedNode = selectedId && local.template ? findNode(local.template, selectedId) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !local.template) return;
    const cs = measureContainers(local.template, canvas);
    containersRef.current = cs;
    setContainers(cs);
    const r = canvas.getBoundingClientRect();
    canvasBaseRef.current = { left: r.left, top: r.top };
  }, []);

  const reset = useCallback(() => {
    activeIdRef.current = null;
    dropRef.current = null;
    containersRef.current = [];
    blockedRef.current = new Set();
    setActiveId(null);
    setDrop(null);
    setContainers([]);
  }, []);

  // ---------- 拖动开始 ----------
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      // 保险：不管什么原因，锁定节点不允许进入拖拽流程
      if (!id.startsWith(PALETTE_PREFIX) && local.template) {
        const n = findNode(local.template, id);
        // TODO:
        // if (n&& n.draggable === false) {
        //   reset();
        //   return;
        // }
      }

      activeIdRef.current = id;
      setActiveId(id);

      if (id.startsWith(PALETTE_PREFIX)) {
        // 从组件库拖入：不屏蔽任何容器
        blockedRef.current = new Set();
      } else {
        // 从画布拖出：屏蔽自身 + 所有后代
        const dragged = findNode(local.template, id);
        const blocked = new Set<string>();
        if (dragged) {
          const collect = (n: IComponent | ITemplate) => {
            blocked.add(n._id);
            n.children?.forEach(collect);
          };
          collect(dragged);
        }
        blockedRef.current = blocked;
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
    const { left, top } = canvasBaseRef.current;
    const x = ae.clientX + event.delta.x - left;
    const y = ae.clientY + event.delta.y - top;

    const raw = hitTest(
      containersRef.current,
      x,
      y,
      blockedRef.current,
      HIT_OPTS
    );
    // 画布内节点：等价于原地不动的落点视为无效
    const id = activeIdRef.current;
    const hit =
      raw &&
        id &&
        !id.startsWith(PALETTE_PREFIX) &&
        isNoopDrop(local.template, id, raw)
        ? null
        : raw;

    const prev = dropRef.current;
    const same =
      (prev === null && hit === null) ||
      (prev !== null &&
        hit !== null &&
        prev.containerId === hit.containerId &&
        prev.index === hit.index);

    if (!same) {
      dropRef.current = hit;
      setDrop(hit);
    }
  }, []);

  // ---------- 拖动结束 ----------
  const handleDragEnd = useCallback(
    (_event: DragEndEvent) => {
      const id = activeIdRef.current;
      const target = dropRef.current;

      if (id && target) {
        if (id.startsWith(PALETTE_PREFIX)) {
          // 来自组件库 → 新建节点并插入
          const type = id.slice(PALETTE_PREFIX.length) as NodeType;
          // TODO: insert
          // const node = createNodeByType(type);
          // setTree((prev) =>
          //   insertNode(prev, target.containerId, target.index, node)
          // );
        } else if (!isNoopDrop(local.template, id, target)) {
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

  // ---------- 指示条几何 ----------
  const indicator = useMemo(() => {
    if (!drop) return null;
    const c = containers.find((x) => x.id === drop.containerId);
    return c ? getIndicatorRect(c, drop.index) : null;
  }, [drop, containers]);
  const dropContainer = useMemo(() => {
    if (!drop) return null;
    return containers.find(c => c.id === drop.containerId) ?? null;
  }, [drop, containers]);

  // ---------- 拖动预览用节点 ----------
  const activeNode = useMemo(() => {
    if (!activeId) return null;
    if (activeId.startsWith(PALETTE_PREFIX)) {
      // TODO: insert
      // return createNodeByType(
      //   activeId.slice(PALETTE_PREFIX.length) as NodeType
      // );
    }
    return findNode(local.template, activeId);
  }, [activeId, local.template]);

  useEffect(() => {
    if (template_id && template_id !== local.template_id) {
      local.setTemplateId(template_id)
      refreshTemplateDetail()
    }
  }, [template_id])

  return (
    <Observer>{() => (
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
              <div style={{ flex: 1, boxShadow: '0 0 10px #1890ff', overflow: 'auto' }} data-node-id={template_id}>
                {local.template ? local.template.children.map(c => (
                  <NodeWrapper
                    key={c._id}
                    self={c}
                  />
                )) : null}
              </div>
              {indicator && (
                <div
                  className="drop-indicator-wrap"
                  style={{
                    left: indicator.left,
                    top: indicator.top,
                    width: indicator.width,
                    height: indicator.height,
                  }}
                >
                  {/* key 变化 → 内层重挂载 → pop 动画重播 */}
                  <div
                    className="drop-indicator-inner"
                    key={`${drop!.containerId}:${drop!.index}`}
                  />
                </div>
              )}
              {dropContainer && (
                <div
                  className="drop-container-highlight"
                  style={{
                    left: dropContainer.rect.left,
                    top: dropContainer.rect.top,
                    width: dropContainer.rect.width,
                    height: dropContainer.rect.height,
                  }}
                />
              )}
            </div>
            <EditorPanel
              node={selectedNode}
              onChange={(patch) => {
                // if (selectedId) setTree((prev) => prev && updateNode(prev, selectedId, patch));
              }}
              onClose={() => setSelectedId(null)}
            />
            <DragOverlay dropAnimation={null}>
              {activeNode ? <DragPreview node={activeNode} /> : null}
            </DragOverlay>
          </ModeContext.Provider>
          {local.loadingTemplate && <Spin fullscreen spinning />}
        </div>
      </DndContext>
    )}</Observer>
  )
})