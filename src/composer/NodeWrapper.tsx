import { useDraggable } from '@dnd-kit/core';
import { INode } from '../types';
import { ModeContext, PageContext } from '@/groups/context';
import { memo, useContext, useMemo } from 'react';
import BaseNode from '../nodes/index'

export const NodeWrapper = memo(function ComponentView({ self, setNodeField, source, setDataField, onContextMenu, ...props }: INode) {
  const mode = useContext(ModeContext);
  const page = useContext(PageContext);
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
  const Com = BaseNode[self.type as keyof typeof BaseNode];
  if (Com) {
    return (
      <Com self={self} setNodeField={setNodeField} bindings={bindings} source={source} setDataField={setDataField} mode={mode} page={page} {...props}>
        {self.children ? self.children.map(child => <NodeWrapper key={child._id} self={child} setNodeField={setNodeField} source={source} setDataField={setDataField} onContextMenu={bindings.root.onContextMenu} />) : null}
      </Com>
    )
  } else {
    return <div>不支持</div>
  }
})
