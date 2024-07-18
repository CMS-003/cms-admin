import { types } from 'mobx-state-tree'
import { ComponentItem } from './component';

const menu = types.model({
  tree: types.maybe(ComponentItem),
  flag: types.optional(types.number, Date.now()),
}).views(self => ({
  getTree() {
    return self.tree
  }
})).actions((self) => ({
  setTree(tree: any) {
    self.tree = tree
  },
  setFlag(flag: number) {
    self.flag = flag
  }
}))
export default menu;