import { types } from 'mobx-state-tree'

const item: any = types.model('item', {
  _id: types.string,
  tree_id: types.optional(types.string, ''),
  parent_id: types.optional(types.string, ''),
  project_id: types.optional(types.string, ''),
  title: types.optional(types.string, ''),
  name: types.optional(types.string, ''),
  desc: types.optional(types.string, ''),
  status: types.optional(types.number, 1),
  order: types.optional(types.number, 1),
  available: types.optional(types.number, 0),
  accepts: types.array(types.string),
  createdAt: types.string,
  updatedAt: types.string,
  attrs: types.maybe(types.model({
    path: types.optional(types.string, ''),
  })),
  children: types.maybe(types.array(types.late(() => item))),
}).actions(self => ({

}));

const menu = types.model({
  tree: types.maybe(item),
}).views(self => ({
  getTree() {
    return self.tree
  }
})).actions((self) => ({
  setTree(tree: any) {
    self.tree = tree
  },
}))
export default menu;