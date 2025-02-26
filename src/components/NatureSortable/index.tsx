import React, { useState, ReactElement, JSXElementConstructor, CSSProperties, Fragment } from "react";
import { Observer } from 'mobx-react-lite'
import { DragDropContext, Droppable, Draggable, DropResult, Direction, DraggableProvided, DraggableStateSnapshot, DraggableChildrenFn, DraggingStyle } from "react-beautiful-dnd";
import styled, { StyledComponent } from "styled-components";
import store from "@/store";
import { RowProps } from "antd";

const Wrap = styled.div`
  // display: flex;
  // align-items: flex-start;
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
  wrap,
  ...restProps
}: {
  droppableId: string;
  direction?: Direction;
  items: any[];
  onDragStart?: () => void;
  sort: (sourceIndex: number, destinationIndex: number) => void;
  wrap?: React.ForwardRefExoticComponent<RowProps & React.RefAttributes<HTMLDivElement>> | StyledComponent<"div", any, RowProps, never>;
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
  const Container = wrap || Wrap;
  return (
    <DragDropContext onDragStart={e => {
      store.app.setIsDragging(true);
      restProps.onDragStart && restProps.onDragStart();
    }} onDragEnd={(result) => {
      store.app.setIsDragging(false);
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
          <Container ref={provided.innerRef} {...provided.droppableProps} style={{ width: '100%', flexDirection: direction === 'horizontal' ? 'row' : 'column' }}>
            {items.map((item, index) => (
              <Observer key={item._id}>{() => (
                <Draggable draggableId={item._id} index={index} isDragDisabled={store.app.can_drag_id !== item._id}>
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
              )}</Observer>

            ))}
            {provided.placeholder}
          </Container>
        )}
      </Droppable>
    </DragDropContext>
  );
};
