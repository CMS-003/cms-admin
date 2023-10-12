import { Observer } from 'mobx-react-lite'
import { DragDropContext, Droppable, Draggable, DraggingStyle, NotDraggingStyle, DropResult, Direction } from "react-beautiful-dnd";

const reorder = (list: any, startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

export default function SortList({ items, droppableId, mode, direction = 'vertical', sort, listStyle = {}, itemStyle = {}, renderItem, ...restProps }: {
  sort: Function;
  droppableId: string;
  items: any[];
  itemStyle: Object;
  direction?: Direction;
  listStyle?: any;
  renderItem: Function;
  mode: String;
  children?: Element;
  isDragDisabled?: boolean;
  onDragStart?: () => void;
  onDragEnd?: (result: DropResult) => Promise<void>;
}) {
  return <Observer>{() => {
    return <DragDropContext
      onDragStart={() => {
      }} onDragEnd={async (result) => {
        if (!result.destination) {
          return;
        }
        reorder(
          items,
          result.source.index,
          result.destination.index
        );
        await sort(result.source.index, result.destination.index)
      }}>
      <Droppable droppableId={droppableId} direction={direction} isDropDisabled={mode === 'preview'}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{ display: 'flex', flexDirection: direction === 'horizontal' || listStyle.flexDirection === 'row' ? 'row' : 'column', flex: listStyle.flex || 'auto' }}
          >
            {items.map((item: any, index: number) => (
              <Draggable key={item._id} draggableId={item._id} isDragDisabled={mode === 'preview'} index={index}>
                {(provided, snapshot) => {
                  let transform = (provided.draggableProps.style as any).transform;
                  if (snapshot.isDragging) {
                    if (transform) {
                      transform = transform.replace(/\(.+\,/, "(0,");
                    }
                  }
                  const style = {
                    ...provided.draggableProps.style,
                    transform,
                    background: snapshot.isDragging ? 'lightgreen' : ''
                  };
                  return (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      // 设置整块拖动 {...(provided.dragHandleProps)}
                      style={{
                        // flex 解决嵌套时的样式问题
                        flex: Object.fromEntries(item.style).flex || '',
                        ...style,
                        ...itemStyle,
                      }}>
                      {renderItem({ item, index, handler: provided.dragHandleProps, ...restProps })}
                    </div>
                  )
                }}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  }}</Observer>
}