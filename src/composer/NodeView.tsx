// src/NodeView.tsx
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Node } from './tree';
import { ContextMenu, type MenuAction } from './ContextMenu';

type NodeViewProps = {
  node: Node;
  /** 从父级强制覆盖：不传则读 node.draggable，缺省 true */
  canDrag?: boolean;
  rootId: string;
  onMenuAction: (a: MenuAction) => void;
};

export const NodeView = React.memo(function NodeView({
  node,
  canDrag,
  rootId,
  onMenuAction,
}: NodeViewProps) {
  const dragEnabled = canDrag ?? node.draggable ?? true;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: node.id,
    disabled: !dragEnabled,
  });

  const isContainer = node.dir != null && node.children != null;

  const cls = [
    'node',
    isContainer ? 'node-container' : 'node-leaf',
    isDragging ? 'is-dragging' : '',
    !dragEnabled ? 'is-locked' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ContextMenu node={node} rootId={rootId} onAction={onMenuAction}>
      <div
        ref={setNodeRef}
        data-node-id={node.id}
        data-dir={node.dir}
        className={cls}
        style={isContainer ? { flexDirection: node.dir } : undefined}
      >
        {dragEnabled ? (
          <div className="node-handle" {...listeners} {...attributes}>
            <span className="node-handle-dots" />
          </div>
        ) : (
          node.id === 'root' ? null : <div className="node-handle node-handle--ghost" aria-hidden="true">
            <span className="node-handle-dots" />
          </div>
        )}

        {isContainer ? (
          node.children!.length ? (
            node.children!.map((c) => <NodeView
              key={c.id}
              node={c}
              rootId={rootId}
              onMenuAction={onMenuAction} />)
          ) : (
            <span className="node-empty-hint">
              {node.dir === 'row' ? '水平容器' : '垂直容器'}
            </span>
          )
        ) : (
          <NodeContent node={node} />
        )}
      </div>
    </ContextMenu>
  );
});

/** 叶子内容：按节点 id 后缀演示不同控件 */
function NodeContent({ node }: { node: Node }) {
  // 演示规则：
  //   id 以 c1 结尾 → 输入框
  //   id 以 c2 结尾 → 带关闭按钮的卡片
  //   其余        → 纯文本
  if (node.id.endsWith('c1')) {
    return (
      <input
        className="node-input"
        defaultValue={node.label}
        placeholder="输入…"
        onPointerDown={(e) => e.stopPropagation()}
      />
    );
  }
  if (node.id.endsWith('c2')) {
    return (
      <div className="node-card">
        <span>{node.label}</span>
        <button
          className="node-close"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            console.log('close', node.id);
          }}
        >
          ×
        </button>
      </div>
    );
  }
  return <span>{node.label}</span>;
}