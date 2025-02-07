import { Observer } from 'mobx-react-lite'
import { DragDropContext, Droppable, Draggable, DropResult, Direction } from "react-beautiful-dnd";

const reorder = (list: any, startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

export default function SortList({
  items,
  droppableId,
  mode,
  direction = 'vertical',
  sort,
  listStyle = {},
  itemStyle = {},
  renderItem,
  ukey = '_id',
  ...restProps
}: {
  ukey?: string;
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
            data-drag="container"
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              ...listStyle,
              display: 'flex',
              height: '100%',
              flexDirection: direction === 'horizontal' || listStyle.flexDirection === 'row' ? 'row' : 'column',
              flex: listStyle.flex !== undefined ? listStyle.flex : 'auto',
              backgroundColor: snapshot.isDraggingOver ? '#fefefe' : 'transparent',
            }}
          >
            {items.map((item: any, index: number) => (
              <Draggable key={item[ukey] || index + ''} draggableId={item[ukey] || index + ''} isDragDisabled={mode === 'preview'} index={index}>
                {(provided, snapshot) => {
                  let transform = (provided.draggableProps.style as any).transform;
                  if (snapshot.isDragging && transform) {
                    if (direction === 'vertical') {
                      transform = transform.replace(/\(.+,/, "(0,");
                    } else {
                      transform = transform.replace(/,.+\)/, ",0)");
                    }
                  }
                  const style = {
                    ...provided.draggableProps.style,
                    transform,
                    background: snapshot.isDragging ? '#97d7f5' : ''
                  };
                  return (
                    <div
                      data-drag="item"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      // 设置整块拖动 
                      // {...(provided.dragHandleProps)}
                      style={{
                        ...style,
                        ...itemStyle,
                        ...item.style,
                        // flex 解决嵌套时的样式问题
                        // flex: item.style && Object.fromEntries(item.style).flex || '',
                      }}>
                      {renderItem({ item, index, isDragging: snapshot.isDragging, handler: provided.dragHandleProps, ...restProps })}
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