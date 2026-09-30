import { useDraggable } from '@dnd-kit/core';
import { IBindings, IComponent } from '../types';
import { ModeContext, PageContext } from '@/groups/context';
import { memo, useContext, useMemo } from 'react';
import BaseNode from '../nodes/index'

export const MemoNodeView = memo(function ComponentView({ self, bindings }: { self: IComponent, bindings: IBindings; }) {
  const mode = useContext(ModeContext);
  const page = useContext(PageContext);

  const Com = BaseNode[self.type as keyof typeof BaseNode];

  if (Com) {
    return (
      <Com self={self} bindings={bindings} mode={mode} page={page}>
        {self.children ? self.children.map(child => <NodeWrapper key={child._id} self={child} onContextMenu={bindings.root.onContextMenu} />) : null}
      </Com>
    )
  } else {
    return <div>不支持</div>
  }
})

export function NodeWrapper({ self, onContextMenu }: { self: IComponent; onContextMenu?: React.MouseEventHandler<HTMLDivElement> }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: self._id, });
  const bindings = useMemo(
    () => ({
      root: {
        ref: setNodeRef,
        'data-node-id': self._id,
        'data-node-type': self.type,
        onContextMenu,
      },
      handle: {
        attributes,
        listeners,
      },
      isDragging,
    }),
    [setNodeRef, self._id, self.type, onContextMenu, attributes, listeners, isDragging]
  );
  return <MemoNodeView self={self} bindings={bindings} />;
}