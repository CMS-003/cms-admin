import { useDraggable } from '@dnd-kit/react';
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
  // @dnd-kit/react：ref 直接挂在可拖拽元素上，事件监听由 manager 自动接管
  const { ref, isDragging } = useDraggable({
    // 必须是组件名（对应 nodes/index.tsx 的 key），供 dragEnd 还原节点类型
    id: `palette:${type.name}`,
    data: { source: 'palette', type },
  });

  return (
    <div
      ref={ref}
      className={`palette-item${isDragging ? ' is-dragging' : ''}`}
    >
      <img src={type.cover} />
      <div className='main'>
        <span className="palette-item-label">{type.title}</span>
        <span className="palette-item-hint">{type.name}</span>
      </div>
    </div>
  );
}
