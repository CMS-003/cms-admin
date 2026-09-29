// src/Palette.tsx
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { NodeType } from './tree';
import { IComponentType } from '../types';

export function Palette({ types, loading }: { types: IComponentType[]; loading: boolean }) {
  return (
    <aside className="palette">
      <h3 className="palette-title">组件库</h3>
      <div className="palette-list">
        {loading ? <div></div> : [{ value: 'container', label: '容器' }, { value: 'widget', label: '控件' }, { value: 'component', label: '组件' }].map(t => (<div key={t.value}>
          <div style={{ fontWeight: 600 }}>{t.label}</div>
          <div style={{ border: '1px solid #ccc' }}>
            {types.filter(it => it.group === t.value).map(type => < PaletteItem key={type.name} type={type} />)}
          </div>
        </div>))
        }
      </div>
      <p className="palette-tip">拖拽左侧组件到画布中<br />或拖动画布内节点调整位置</p>
    </aside>
  );
}

function PaletteItem({ type }: { type: IComponentType }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { source: 'palette', type },
  });

  return (
    <div
      ref={setNodeRef}
      className={`palette-item${isDragging ? ' is-dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <img src={type.cover} />
      <div className='main'>
        <span className="palette-item-label">{type.title}</span>
        <span className="palette-item-hint">{type.name}</span>
      </div>
    </div>
  );
}