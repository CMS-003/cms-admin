import { Observer, useLocalObservable } from "mobx-react";
import SortableList, { DataItem, Direction } from "./SortableList"
import { types, IMSTArray, getSnapshot, IAnyModelType } from 'mobx-state-tree'
import Sortable from 'components/Order';
import { SortProvider, useSort } from 'components/Order/context';
import { useEffect, useRef, useState } from "react";
import { Button, message } from "antd";
import apis from "@/api";
import store from "@/store";

const initialItems: { id: string, text: string }[] = [
  { id: 'a', text: 'ItemA' },
  { id: 'b', text: 'ItemB' },
  { id: 'c', text: 'ItemC' },
  { id: 'd', text: 'ItemD' },
  { id: 'e', text: 'ItemE' },
];
const map: { [key: string]: number } = {
  '1': 50,
  '2': 100,
  '3': 150,
  '4': 200,
}

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

function Temp({ item, index }: { item: any, index: number }) {
  const { drag, getStyle, draggingId } = useSort();
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    drag(ref.current, index);
  }, [ref.current, index])
  return <div
    ref={ref}
    data-sortable-id={item.id}
    style={{
      padding: '10px',
      ...getStyle(index),
      backgroundColor: draggingId === item.id ? 'lightblue' : '',
    }}
  >
    {item.text}
  </div>
}

export default function Page() {
  const [order, setOrder] = useState<any[]>(initialItems);
  const local = useLocalObservable(() => ({
    loading: false,
  }))
  return <Observer>{() => (
    <div style={{ margin: '0 auto' }}>
      dashboard
      <h2>Horizontal Sortable List</h2>
      <Button loading={local.loading} onClick={async () => {
        try {
          local.loading = true;
          const res = await apis.refresh({ refresh_token: store.user.getRefreshToken() })
          if (res.code === 0 && res.data) {
            store.user.setAccessToken(res.data.access_token)
            store.user.setRefreshToken(res.data.refresh_token)
          } else {
            message.error(res.message)
          }
        } catch (e) {
          console.log(e);
        } finally {
          local.loading = false;
        }
      }}>刷新token</Button>
      <Sortable
        items={order}
        sort={(srcIndex: number, dstIndex: number) => {
          setOrder((prevOrder) => {
            const newOrder = [...prevOrder];
            const [moved] = newOrder.splice(srcIndex, 1);
            newOrder.splice(dstIndex, 0, moved);
            return newOrder;
          });
        }}
        render={({ item, refs, style, isDragging, onMouseDown }) => (
          <div
            key={item.id}
            ref={v => refs.current[item.id] = v}
            data-sortable-id={item.id}
            onMouseDown={onMouseDown}
            style={{
              padding: '10px',
              ...style,
              backgroundColor: isDragging ? 'lightblue' : '',
            }}>
            {item.text}
          </div>
        )}
      />
      {/* 
      <SortProvider
        value={order}
        field="id"
        direction="horizontal"
        sort={(srcIndex: number, dstIndex: number) => {
          console.log(srcIndex, dstIndex, 'sort')
          setOrder((prevOrder) => {
            const newOrder = [...prevOrder];
            const [moved] = newOrder.splice(srcIndex, 1);
            newOrder.splice(dstIndex, 0, moved);
            return newOrder;
          });
        }}
      >
        {order.map((item, index) => {
          return <Temp key={item.id} item={item} index={index} />
        })}
      </SortProvider> */}
    </div>
  )
  }</Observer >
}