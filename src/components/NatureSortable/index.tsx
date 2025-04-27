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

function lockAxis(direction: Direction | undefined, style: DraggableProvided['draggableProps']['style']) {
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
  };
}

export default function NatureSortable({
  droppableId,
  direction,
  disabled = false,
  items,
  renderItem,
  wrap,
  style = {},
  ...restProps
}: {
  droppableId: string;
  disabled?: boolean,
  direction?: Direction;
  items: any[];
  style?: CSSProperties,
  onDragStart?: () => void;
  sort: (sourceIndex: number, destinationIndex: number) => void;
  wrap?: React.ForwardRefExoticComponent<RowProps & React.RefAttributes<HTMLDivElement>> | StyledComponent<"div", any, RowProps, never>;
  renderItem: ((arg: {
    item: any,
    index?: number,
    dnd: {
      isDragging: boolean;
      ref: DraggableProvided['innerRef'];
      props: DraggableProvided['draggableProps'] | DraggableProvided['dragHandleProps'];
      style: DraggableProvided['draggableProps']['style'];
    }
  }) => ReactElement<HTMLElement, string | JSXElementConstructor<any>>);
}) {
  const Container = wrap || Wrap;
  return (
    <DragDropContext onDragStart={e => {
      store.component.setIsDragging(true);
      restProps.onDragStart && restProps.onDragStart();
    }} onDragEnd={(result) => {
      store.component.setIsDragging(false);
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
              props: {
                ...provided.draggableProps,
                ...provided.dragHandleProps
              },
              style: lockAxis(direction, provided.draggableProps.style),
            },
          })
        }
      >
        {(provided) => (
          <Container ref={provided.innerRef} {...provided.droppableProps} style={{
            display: 'flex',
            flexDirection: direction === 'horizontal' ? 'row' : 'column',
            overflow: 'auto',
            flex: 1,
            ...style,
          }}>
            {items.map((item, index) => (
              <Observer key={item._id || index}>{() => (
                <Draggable draggableId={item._id || index.toString()} index={index} isDragDisabled={disabled || (item._id && store.component.can_drag_id !== item._id)}>
                  {(provided, snapshot) => renderItem({
                    item,
                    index,
                    dnd: {
                      isDragging: snapshot.isDragging,
                      ref: provided.innerRef,
                      props: {
                        ...provided.draggableProps,
                        ...provided.dragHandleProps
                      },
                      style: lockAxis(direction, provided.draggableProps.style),
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
