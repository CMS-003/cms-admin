// src/EditorPanel.tsx
import { IComponent, ITemplate } from '@/types';
import React from 'react';

type Props = {
  node: ITemplate | IComponent | null;
  onChange: (patch: Partial<Omit<IComponent, '_id'>>) => void;
  onClose: () => void;
};

export function EditorPanel({ node, onChange, onClose }: Props) {
  if (!node) {
    return (
      <aside className="editor editor--empty">
        <p>右键组件 → 「编辑属性」<br />在此处修改</p>
      </aside>
    );
  }

  return (
    <aside className="editor">
      <header className="editor-head">
        <h3>属性</h3>
        <button className="editor-close" onClick={onClose}>×</button>
      </header>

      <label className="editor-field">
        <span>ID</span>
        <code>{node._id}</code>
      </label>

      <label className="editor-field">
        <span>名称</span>
        <input
          value={node.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </label>

      <div className="editor-meta">
        {node.children ? `子节点 ${node.children.length} 个` : '叶子节点'}
      </div>
    </aside>
  );
}