import { Observer } from "mobx-react";
import SortableList, { DataItem, Direction } from "./SortableList"
import { types, IMSTArray, getSnapshot, IAnyModelType } from 'mobx-state-tree'

const ItemModel = types.model('Item', {
  _id: types.string,
  parent_id: types.string,
  title: types.string,
  layout: types.optional(types.enumeration<Direction>(['horizontal', 'vertical']), 'vertical'),
  children: types.array(types.late((): IAnyModelType => ItemModel))
}).actions(self => ({
  swap(oldIndex: number, newIndex: number) {
    if (oldIndex === newIndex) {
      return;
    }
    const [removed] = self.children.splice(oldIndex, 1);
    const old = getSnapshot(removed);
    self.children.splice(newIndex, 0, ItemModel.create(old as DataItem));
  },
}));
const ListModel = types.model('list', {
  list: types.array(ItemModel),
});
const data = ListModel.create({
  list: [
    {
      _id: 'a', parent_id: '', title: 'text-a', layout: 'horizontal', children: [
        { _id: 'a-a', parent_id: 'a', title: 'a-a', children: [] },
        { _id: 'a-b', parent_id: 'a', title: 'a-b', children: [] },
        { _id: 'a-c', parent_id: 'a', title: 'a-c', children: [] },
        { _id: 'a-d', parent_id: 'a', title: 'a-d', children: [] },
        { _id: 'a-e', parent_id: 'a', title: 'a-e', children: [] },
      ]
    },
    {
      _id: 'b', parent_id: '', title: 'text-b', children: [
        { _id: 'b-a', parent_id: 'b', title: 'b-a', children: [] },
        { _id: 'b-b', parent_id: 'b', title: 'b-b', children: [] },
        { _id: 'b-c', parent_id: 'b', title: 'b-c', children: [] },
        { _id: 'b-d', parent_id: 'b', title: 'b-d', children: [] },
        { _id: 'b-e', parent_id: 'b', title: 'b-e', children: [] },
      ]
    },
    { _id: 'c', parent_id: '', title: 'c', children: [] },
    { _id: 'd', parent_id: '', title: 'd', children: [] },
    { _id: 'e', parent_id: '', title: 'e', children: [] },
  ]
});

export default function Page() {
  return <Observer>{() => (
    <div>
      dashboard
      <div style={{ position: 'relative' }}>
        {data.list.map(self => (
          <SortableList
            key={self._id}
            self={self}
            direction={self.layout}
            renderItem={({ self, handle }) => (
              <div
                key={self._id}
                id={self._id}
                draggable
                {...handle}
                style={{
                  border: '1px solid #ccc',
                  width: 50,
                  height: 50,
                  ...handle.style,
                }}>{self.title}</div>
            )}
          />
        ))}
      </div>
    </div>
  )}</Observer>
}