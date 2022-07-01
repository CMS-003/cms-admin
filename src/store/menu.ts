import { types } from 'mobx-state-tree'

const menu: any = types.model('menu', {
  id: types.string,
  icon: types.string,
  alive: types.string,
  key: types.string,
  order: types.maybe(types.number),
  parent_key: types.string,
  path: types.string,
  parent_path: types.maybe(types.string),
  show: types.optional(types.boolean, true),
  children: types.array(types.late(() => menu)),
}).actions(self => ({

}));

export default menu;