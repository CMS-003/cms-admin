import { types, ISimpleType, IMSTArray, IModelType, IOptionalIType, IArrayType, IStateTreeNode, _NotCustomized } from 'mobx-state-tree'
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
  openedPanels: types.array(types.model('panel_tab', {
    path: types.string,
    title: types.optional(types.string, ''),
  })),
}).views(self => ({
  getList() {
    return self.list
  }
})).actions((self) => ({
  setList(list: any) {
    self.list = list
  },
  setCurrentPath(path: string) {
    const p = path && self.openedPanels.find(v => v.path === path) ? path : '/manager/dashboard';
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
  setOpenedPanels(items: (IMSTArray<IModelType<{ path: ISimpleType<string>; title: IOptionalIType<ISimpleType<string>, [undefined]>; }, {}, _NotCustomized, _NotCustomized>> & IStateTreeNode<IArrayType<IModelType<{ path: ISimpleType<string>; title: IOptionalIType<ISimpleType<string>, [undefined]>; }, {}, _NotCustomized, _NotCustomized>>>)) {
    self.openedPanels = items;
    storage.setKey('opened-panels', items)
  },
  addPanel(path: string, title: string = '') {
    if (!self.openedPanels.find(v => v.path === path)) {
      self.openedPanels.push({ path, title })
      return true
    }
    return false
  },
  closePanel(tag: string) {
    const index = self.openedPanels.findIndex(item => item.path === tag)
    if (index !== -1) {
      self.openedPanels.splice(index, 1)
    }
  },
}))
export default router;