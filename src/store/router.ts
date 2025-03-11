import { types, ISimpleType, IMSTArray } from 'mobx-state-tree'
import storage from '../utils/storage'

const route: any = types.model('route', {
  id: types.string,
  cover: types.optional(types.string, ''),
  alive: types.optional(types.boolean, false),
  key: types.optional(types.string, ''),
  order: types.maybe(types.number),
  parent_key: types.optional(types.string, ''),
  path: types.optional(types.string, ''),
  parent_path: types.maybe(types.string),
  show: types.optional(types.boolean, true),
  children: types.array(types.late(() => route)),
}).actions(self => ({

}));

const router = types.model({
  currentPath: types.optional(types.string, ''),
  // 路由菜单部分
  list: types.array(route),
  openedMenu: types.array(types.string),
  defaultOpened: types.array(types.string),
  // 标签页部分
  openedPanels: types.array(types.string),
}).views(self => ({
  getList() {
    return self.list
  }
})).actions((self) => ({
  setList(list: any) {
    self.list = list
  },
  setCurrentPath(path: string) {
    const p = path && self.openedPanels.includes(path) ? path : '/manager/dashboard';
    storage.setKey('current-path', p);
    self.currentPath = p;
  },
  setOpenedMenu(keys: string[]) {
    self.openedMenu = keys as IMSTArray<ISimpleType<string>>;
    storage.setKey('opened-menu', keys);
  },
  getOpenedMenu() {
    return self.openedMenu;
  },
  setOpenedPanels(items: IMSTArray<ISimpleType<string>>) {
    self.openedPanels = items;
    storage.setKey('opened-panels', items)
  },
  addPanel(tag: string) {
    if (!self.openedPanels.includes(tag)) {
      self.openedPanels.push(tag)
      return true
    }
    return false
  },
  closePanel(tag: string) {
    const index = self.openedPanels.findIndex(item => item === tag)
    if (index !== -1) {
      self.openedPanels.splice(index, 1)
    }
  },
}))
export default router;