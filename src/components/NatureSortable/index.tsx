import React, { useState, ReactElement, JSXElementConstructor } from "react";
import { Observer } from 'mobx-react-lite'
import { DragDropContext, Droppable, Draggable, DropResult, Direction, DraggableProvided, DraggableStateSnapshot, DraggableChildrenFn } from "react-beautiful-dnd";
import styled, { StyledComponent } from "styled-components";

const Wrap = styled.div`

`
export default function NatureSortable({
  droppableId,
  direction,
  items,
  renderItem,
  children,
  ...restProps
}: {
  droppableId: string;
  direction?: 'vertical' | 'horizontal';
  items: any[];
  onDragEnd: (result: DropResult) => void;
  children?: () => StyledComponent<"div", any, {}, never>,
  renderItem: ((arg: {
    item: any,
    isDragging: boolean,
    index: number,
    provided: DraggableProvided,
  }) => ReactElement<HTMLElement, string | JSXElementConstructor<any>>);
}) {
  const Container = children ? children() : Wrap;
  return (
    <DragDropContext onDragEnd={restProps.onDragEnd}>
      <Droppable
        droppableId={droppableId}
        direction={direction}
        // 使用 renderClone 来统一使用 renderItem 渲染拖拽时的克隆项
        renderClone={(provided, snapshot, rubric) =>
          renderItem({ item: items[rubric.source.index], provided, isDragging: snapshot.isDragging, index: rubric.source.index })
        }
      >
        {(provided) => (
          <Container ref={provided.innerRef} {...provided.droppableProps}>
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item._id} index={index}>
                {(provided, snapshot) => renderItem({ item, provided, isDragging: snapshot.isDragging, index })}
              </Draggable>
            ))}
            {provided.placeholder}
          </Container>
        )}
      </Droppable>
    </DragDropContext>
  );
};
