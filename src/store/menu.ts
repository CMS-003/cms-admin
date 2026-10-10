import { types } from 'mobx-state-tree'

/**
 * 侧边栏菜单树（来自 bootData.tree 的通用递归结构）。
 *
 * 与 composer 的模板树无关：这个树只用来渲染布局左侧菜单，
 * 消费方是 `layout/menu.tsx`（只读 title / icon / status / attrs.path / children）。
 * 所以这里只声明用得上的字段，多余的字段 MST 会忽略。
 */
const MenuNode = types.model('MenuNode', {
  _id: types.optional(types.string, ''),
  title: types.optional(types.string, ''),
  icon: types.optional(types.string, ''),
  status: types.optional(types.number, 1),
  /** 任意 JSON：菜单跳转路径挂在 attrs.path 上 */
  attrs: types.optional(types.frozen<any>(), {}),
  children: types.array(types.late((): any => MenuNode)),
})

const menu = types.model({
  tree: types.maybe(MenuNode),
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
