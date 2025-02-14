import React from 'react'
import { DraggableProvided } from "react-beautiful-dnd";

function renderItem({ isDragging, provided, item }: { isDragging: boolean, dragIndex?: number, provided: DraggableProvided, item: any }) {
  return <li
    ref={provided.innerRef}
    {...provided.draggableProps}
    {...provided.dragHandleProps}
    style={{
      backgroundColor: isDragging ? 'lightblue' : 'white',
      ...provided.draggableProps.style,
    }}
  >{item.content}</li>
}

export default function Page() {
  return <div>
    dashboard
  </div>
}