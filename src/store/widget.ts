import { types, IType, IModelType, IMSTArray, SnapshotIn, SnapshotOut } from 'mobx-state-tree'
import { IWidget } from '@/types'

export const WidgetType = types.model('WidgetType', {
  _id: types.string,
  title: types.optional(types.string, ''),
  cover: types.optional(types.string, ''),
  desc: types.optional(types.string, ''),
  order: types.optional(types.number, 1),
  status: types.optional(types.number, 1),
});

const Widget = types.model({
  list: types.array(WidgetType),
}).views(self => ({
  getList(): IWidget[] {
    return self.list.toJSON();
  },
})).actions((self) => ({
  setList(items: IWidget[]) {
    self.list.replace(items);
  },
  async fetch() {

  },
}))
export default Widget;