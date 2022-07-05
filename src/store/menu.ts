import { types } from 'mobx-state-tree'
import { MenuItem } from '@/types'

const menuItem: any = types.model('menu', {
  id: types.string,
  cover: types.optional(types.string, ''),
  alive: types.optional(types.boolean, false),
  key: types.optional(types.string, ''),
  order: types.maybe(types.number),
  parent_key: types.optional(types.string, ''),
  path: types.optional(types.string, ''),
  parent_path: types.maybe(types.string),
  show: types.optional(types.boolean, true),
  children: types.array(types.late(() => menuItem)),
}).actions(self => ({

}));

const menuList = types.model({
  list: types.array(menuItem),
  currentPath: types.optional(types.string, ''),
  openedMenu: types.array(menuItem),
}).views(self=>({
  getList() {
    return self.list
  }
})).actions((self) => ({
  setList(list: any) {
    self.list = list
  },
  setCurrentPath(path: string) {

  },
  setOpenKey(key: string) {

  },
  setSelectKey(key: string[]) {

  },
  addOpenedMenu(key: object) {

  },
  getOpenedMenu() {
    return self.openedMenu;
  },
}))
export default menuList;