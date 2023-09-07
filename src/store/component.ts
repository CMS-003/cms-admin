import { types, IType, IMSTArray, SnapshotIn, SnapshotOut, flow } from 'mobx-state-tree'
import { Component, ComponentType } from '@/types'

export const ComponentItem: any = types.model('Component', {
  _id: types.string,
  parent_id: types.optional(types.string, ''),
  tree_id: types.optional(types.string, ''),
  title: types.optional(types.string, ''),
  name: types.optional(types.string, ''),
  cover: types.optional(types.string, ''),
  desc: types.optional(types.string, ''),
  createdAt: types.maybe(types.Date),
  // updatedAt: types.maybe(types.Date),
  accepts: types.optional(types.array(types.string), []),
}).actions(self => ({

}));

const ComponentTypeItem: any = types.model({
  _id: types.string,
  name: types.string,
  title: types.string,
  cover: types.optional(types.string, ''),
  level: types.number,
})

const componentList = types.model({
  list: types.array(ComponentItem),
  types: types.array(ComponentTypeItem),
}).views(self => ({
  getList(): Component[] {
    return self.list.toJSON();
  },
})).actions((self) => ({
  setList(items: IMSTArray<IType<SnapshotIn<Component>, SnapshotOut<Component>, Component>>) {
    self.list = items;
  },
  setTypes(items: ComponentType[]) {
    self.types = items as IMSTArray<IType<SnapshotIn<ComponentType>, SnapshotOut<ComponentType>, ComponentType>>;
  },
  async fetch() {

  },
}))
export default componentList;