import React, { useMemo } from 'react';
import {
  DndContext,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToHorizontalAxis, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import store from '@/store';

interface SortableItemProps {
  id: string;
  item: any;
  handle: boolean,
  disabled: boolean,
  renderItem: Function;
}

function SortableItem(props: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id, });
  const transformWithoutScale = React.useMemo(() => {
    if (!transform) return null;
    const { scaleX, scaleY, ...rest } = transform;
    return { ...rest, scaleX: 1, scaleY: 1 };
  }, [transform]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transformWithoutScale),
    transition,
    display: 'flex',
    zIndex: isDragging ? 9 : 1,
  };
  const handler = ({ ...attributes, ...listeners, })
  return (
    <div
      ref={setNodeRef}
      style={{ ...props.item.style, ...style }}
      {...(props.handle || props.item.disabled || props.disabled ? {} : handler)}
    >
      {props.renderItem(props.item, props.handle && !props.item.disabled && !props.disabled ? handler : {})}
    </div>
  );
}
export function SortDD({
  direction,
  items,
  sort,
  handle = false,
  disabled = false,
  renderItem,
}:
  {
    direction: 'horizontal' | 'vertical',
    items: any[],
    sort?: (oldIndex: number, newIndex: number) => void,
    handle?: boolean,
    disabled?: boolean,
    onDragEnd?: Function,
    renderItem: Function,
    children?: Element;
  }) {
  const renderItems = useMemo(() => {
    return items.map((item) => {
      return <SortableItem
        key={item.id}
        id={item.id}
        item={item}
        handle={handle}
        disabled={item.disabled}
        renderItem={renderItem}
      />
    })
  }, [items])
  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[direction === 'vertical' ? restrictToVerticalAxis : restrictToHorizontalAxis]}
      onDragStart={() => {
        store.component.setIsDragging(true)
      }}
      onDragEnd={(event: any) => {
        const { active, over } = event;
        store.component.setIsDragging(false)
        if (active && over && active.id !== over.id) {
          const oldIndex = items.findIndex(v => v.id === active.id)
          const newIndex = items.findIndex(v => v.id === over.id)
          sort && sort(oldIndex, newIndex)
        }
      }}
    >
      <SortableContext
        items={items}
        disabled={disabled}
        strategy={direction === 'vertical' ? verticalListSortingStrategy : horizontalListSortingStrategy}
      >
        {renderItems}
      </SortableContext>
    </DndContext>
  );

}