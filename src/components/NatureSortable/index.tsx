import React, { useState, ReactElement, JSXElementConstructor, CSSProperties } from "react";
import { Observer } from 'mobx-react-lite'
import { DragDropContext, Droppable, Draggable, DropResult, Direction, DraggableProvided, DraggableStateSnapshot, DraggableChildrenFn, DraggingStyle } from "react-beautiful-dnd";
import styled, { StyledComponent } from "styled-components";

const Wrap = styled.div`

`

function lockAxis(isDragging: boolean, direction: Direction | undefined, style: DraggableProvided['draggableProps']['style']) {
  if (!style) return;
  let transform = style.transform;
  if (direction) {
    if (direction === 'vertical') {
      transform = transform?.replace(/\(.+,/, "(0,");
    } else {
      transform = transform?.replace(/,.+\)/, ",0)");
    }
  }
  return {
    ...style,
    transform,
    backgroundColor: isDragging ? 'lightblue' : '',
  };
}

export default function NatureSortable({
  droppableId,
  direction,
  items,
  renderItem,
  children,
  ...restProps
}: {
  droppableId: string;
  direction?: Direction;
  items: any[];
  onDragStart?: () => void;
  sort: (sourceIndex: number, destinationIndex: number) => void;
  children?: () => StyledComponent<"div", any, {}, never>,
  renderItem: ((arg: {
    item: any,
    dnd: {
      isDragging: boolean;
      ref: DraggableProvided['innerRef'];
      draggableProps: DraggableProvided['draggableProps'];
      dragHandleProps: DraggableProvided['dragHandleProps'];
      style: DraggableProvided['draggableProps']['style'];
    }
  }) => ReactElement<HTMLElement, string | JSXElementConstructor<any>>);
}) {
  return (
    <DragDropContext onDragStart={restProps.onDragStart} onDragEnd={(result) => {
      if (result.destination) {
        restProps.sort(result.source.index, result.destination.index);
      }
    }
    }>
      <Droppable
        droppableId={droppableId}
        direction={direction}
        // 使用 renderClone 来统一使用 renderItem 渲染拖拽时的克隆项
        renderClone={(provided, snapshot, rubric) =>
          renderItem({
            item: items[rubric.source.index],
            dnd: {
              isDragging: snapshot.isDragging,
              ref: provided.innerRef,
              draggableProps: provided.draggableProps,
              dragHandleProps: provided.dragHandleProps,
              style: lockAxis(snapshot.isDragging, direction, provided.draggableProps.style),
            },
          })
        }
      >
        {(provided) => (
          <Wrap ref={provided.innerRef} {...provided.droppableProps}>
            {items.map((item, index) => (
              <Draggable key={item._id} draggableId={item._id} index={index}>
                {(provided, snapshot) => renderItem({
                  item,
                  dnd: {
                    isDragging: snapshot.isDragging,
                    ref: provided.innerRef,
                    draggableProps: provided.draggableProps,
                    dragHandleProps: provided.dragHandleProps,
                    style: lockAxis(snapshot.isDragging, direction, provided.draggableProps.style),
                  }
                })}
              </Draggable>
            ))}
            {provided.placeholder}
          </Wrap>
        )}
      </Droppable>
    </DragDropContext>
  );
};
