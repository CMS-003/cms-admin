// src/App.tsx
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core';

import {
  initialTree,
  findNode,
  moveNode,
  insertNode,
  createNodeByType,
  isNoopDrop,
  removeNode, appendChild, updateNode,
  type Node,
  type NodeType,
} from './tree';
import {
  measureContainers,
  hitTest,
  getIndicatorRect,
  type ContainerInfo,
  type DropTarget,
} from './geometry';
import { NodeView } from './NodeView';
import { Palette } from './Palette';
import { EditorPanel } from './EditorPanel';
import type { MenuAction } from './ContextMenu';

import './styles.css';
import store from '../store';

const PALETTE_PREFIX = 'palette:';
const GAP_TRANSITION_MS = 220; // 略大于 CSS 里 gap 过渡的 200ms
const HIT_OPTS = {
  edgeRatio: 0.22,   // 交叉轴边缘带宽度，控制"让给父容器"的敏感度
  midRatio: 0.5,     // 主轴二分点，控制"内部 index 切换"的敏感度
};

/** 拖动预览（不挂 useDraggable，纯展示） */
function DragPreview({ node }: { node: Node }) {
  const isContainer = node.dir != null && node.children != null;
  const cls = [
    'node',
    isContainer ? 'node-container' : 'node-leaf',
    'is-preview',
  ].join(' ');

  return (
    <div
      className={cls}
      data-dir={node.dir}
      style={isContainer ? { flexDirection: node.dir } : undefined}
    >
      {isContainer ? (
        node.children!.length ? (
          node.children!.map((c) => <DragPreview key={c.id} node={c} />)
        ) : (
          <span className="node-empty-hint">
            {node.dir === 'row' ? '水平容器' : '垂直容器'}
          </span>
        )
      ) : (
        <span>{node.label}</span>
      )}
    </div>
  );
}

export default function Composer() {
  const [tree, setTree] = useState<Node>(initialTree);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [drop, setDrop] = useState<DropTarget | null>(null);
  const [dragging, setDragging] = useState(false);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const canvasBaseRef = useRef({ left: 0, top: 0 });
  const containersRef = useRef<ContainerInfo[]>([]);
  const dropRef = useRef<DropTarget | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const blockedRef = useRef<Set<string>>(new Set());
  const treeRef = useRef(tree);
  treeRef.current = tree;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 右键菜单 action 处理
  const handleMenuAction = useCallback((a: MenuAction) => {
    if (a.kind === 'append') {
      const node = createNodeByType(a.nodeType);
      setTree((prev) => appendChild(prev, a.parentId, node));
    } else if (a.kind === 'delete') {
      setTree((prev) => removeNode(prev, a.nodeId));
      setSelectedId((cur) => (cur === a.nodeId ? null : cur));
    } else if (a.kind === 'edit') {
      setSelectedId(a.nodeId);
    }
  }, []);

  const selectedNode = selectedId ? findNode(tree, selectedId) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cs = measureContainers(treeRef.current, canvas);
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
    setDragging(false);
  }, []);

  // ---------- 拖动开始 ----------
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      // 保险：不管什么原因，锁定节点不允许进入拖拽流程
      if (!id.startsWith(PALETTE_PREFIX)) {
        const n = findNode(treeRef.current, id);
        if (n && n.draggable === false) {
          reset();
          return;
        }
      }

      activeIdRef.current = id;
      setActiveId(id);
      setDragging(true); // ← 触发 canvas[data-dragging="true"]，gap 变大

      if (id.startsWith(PALETTE_PREFIX)) {
        // 从组件库拖入：不屏蔽任何容器
        blockedRef.current = new Set();
      } else {
        // 从画布拖出：屏蔽自身 + 所有后代
        const dragged = findNode(treeRef.current, id);
        const blocked = new Set<string>();
        if (dragged) {
          const collect = (n: Node) => {
            blocked.add(n.id);
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
        isNoopDrop(treeRef.current, id, raw)
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
          const node = createNodeByType(type);
          setTree((prev) =>
            insertNode(prev, target.containerId, target.index, node)
          );
        } else if (!isNoopDrop(treeRef.current, id, target)) {
          // 来自画布 → 移动
          setTree((prev) =>
            moveNode(prev, id, target.containerId, target.index)
          );
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

  // ---------- 拖动预览用节点 ----------
  const activeNode = useMemo(() => {
    if (!activeId) return null;
    if (activeId.startsWith(PALETTE_PREFIX)) {
      return createNodeByType(
        activeId.slice(PALETTE_PREFIX.length) as NodeType
      );
    }
    return findNode(tree, activeId);
  }, [activeId, tree]);

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

        <div
          className="canvas"
          ref={canvasRef}
          data-dragging={dragging ? 'true' : 'false'}
        >
          <NodeView
            node={tree}
            canDrag={false}
            rootId={tree.id}
            onMenuAction={handleMenuAction} />

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
        </div>

        <EditorPanel
          node={selectedNode}
          onChange={(patch) => {
            if (selectedId) setTree((prev) => updateNode(prev, selectedId, patch));
          }}
          onClose={() => setSelectedId(null)}
        />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeNode ? <DragPreview node={activeNode} /> : null}
      </DragOverlay>
    </DndContext>
  );
}