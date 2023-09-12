import { Observer } from 'mobx-react-lite'
import { DragDropContext, Droppable, Draggable, DraggingStyle, NotDraggingStyle, DropResult, Direction } from "react-beautiful-dnd";

const reorder = (list: any, startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

const getItemStyle = (isDragging: boolean, draggableStyle: DraggingStyle | NotDraggingStyle | undefined) => ({
  // change background colour if dragging
  background: isDragging ? "lightgreen" : "",
  padding: 0,
  // styles we need to apply on draggables
  ...draggableStyle
});

// const getListStyle = (isDraggingOver: boolean) => ({});

export default function SortList({ handler, items, droppableId, mode, direction = 'vertical', sort, listStyle = {}, itemStyle = {}, renderItem, ...restProps }: {
  handler: any;
  sort: Function;
  droppableId: string;
  items: any[];
  itemStyle: Object;
  direction?: Direction;
  listStyle?: Object;
  renderItem: Function;
  mode: String;
  children?: Element;
  isDragDisabled?: boolean;
  onDragStart?: () => void;
  onDragEnd?: (result: DropResult) => Promise<void>;
}) {
  return <Observer>{() => {
    return <DragDropContext
      // isDragDisabled={mode === 'preview'} 
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
            style={direction === 'horizontal' ? { display: 'flex', flexDirection: 'row' } : {}}
          >
            {items.map((item: any, index: number) => (
              <Draggable key={item._id} draggableId={item._id} isDragDisabled={mode === 'preview'} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...(handler ? {} : provided.dragHandleProps)}
                    style={{
                      ...(getItemStyle(
                        snapshot.isDragging,
                        provided.draggableProps.style
                      )),
                      ...itemStyle
                    }}>
                    {handler && <div style={{ textIndent: 0 }}{...provided.dragHandleProps}>{handler}</div>}
                    {renderItem({ item, index, ...restProps })}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  }}</Observer>
}