import { types, IType, IMSTArray, SnapshotIn, SnapshotOut } from 'mobx-state-tree'
import { Component } from '@/types'

const ComponentItem: any = types.model({
  id: types.string,
  title: types.optional(types.string, ''),
  name: types.optional(types.string, ''),
  cover: types.optional(types.string, ''),
  desc: types.optional(types.string, ''),
  createdAt: types.maybe(types.Date),
  updatedAt: types.maybe(types.Date),
  accepts: types.optional(types.array(types.string), []),
}).actions(self => ({

}));

const componentList = types.model({
  list: types.array(ComponentItem),
}).views(self => ({
  getList(): Component[] {
    return self.list.toJSON();
  },
})).actions((self) => ({
  setList(items: IMSTArray<IType<SnapshotIn<Component>, SnapshotOut<Component>, Component>>) {
    self.list = items;
  }
}))
export default componentList;