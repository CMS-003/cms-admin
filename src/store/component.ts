import { types, IType, IMSTArray, SnapshotIn, SnapshotOut, getSnapshot, IModelType, IAnyModelType } from 'mobx-state-tree'
import { IComponent, IComponentType } from '@/types'
import _, { } from 'lodash'

function deepEqual(a: any, b: any) {
  for (let k in a) {
    let equal = true;
    if (_.isPlainObject(a[k])) {
      if (_.isEmpty(a[k]) && !_.isEmpty(b[k])) {
        return false
      }
      equal = deepEqual(a[k], b[k]);
    } else {
      equal = _.isEqual(a[k], b[k]);
    }
    if (!equal) {
      return false;
    }
  }
  return true;
}

type ComponentItemKeys = 'title' | 'name'

export const ComponentItem = types.model('Component', {
  // 编辑用属性
  $origin: types.frozen({}),
  $new: types.optional(types.boolean, false),
  $delete: types.optional(types.boolean, false),
  _id: types.optional(types.string, ''),
  type: types.optional(types.string, ''),
  parent_id: types.optional(types.string, ''),
  tree_id: types.optional(types.string, ''),
  title: types.optional(types.string, ''),
  name: types.optional(types.string, ''),
  cover: types.optional(types.string, ''),
  desc: types.optional(types.string, ''),
  // createdAt: types.maybe(types.Date),
  // updatedAt: types.maybe(types.Date),
  accepts: types.optional(types.array(types.string), []),
  children: types.array(types.late((): IAnyModelType => ComponentItem))
}).views(self => ({
  toJSON() {
    const data = getSnapshot(self);
    return _.omit(data, ['data', 'children', '$new', '$delete', '$origin'])
  },
})).actions(self => ({
  diff() {
    return !deepEqual(self.$origin, self.toJSON()) || self.$delete === true || self.$new === true;
  },
  setAttr(key: ComponentItemKeys, value: any) {
    self[key] = value;
  },
  afterCreate() {
    self.$origin = self.toJSON() as any;
  }
}));

const ComponentTypeItem = types.model({
  _id: types.string,
  name: types.string,
  title: types.string,
  cover: types.optional(types.string, ''),
  level: types.number,
  accepts: types.array(types.string),
})

const componentList = types.model({
  list: types.array(ComponentItem),
  types: types.array(ComponentTypeItem),
}).views(self => ({
  getList(): IComponent[] {
    return self.list.toJSON();
  },
})).actions((self) => ({
  setList(items: IComponent[]) {
    self.list = items as IMSTArray<typeof ComponentItem>;
  },
  setTypes(items: IComponentType[]) {
    self.types = items as IMSTArray<typeof ComponentTypeItem>;
  },
  canDrop(from: string, to: string) {
    const type = self.types.find(it => it.name === to);
    if (!type) {
      return false;
    }
    const result = type.accepts.length === 0 || type.accepts.includes(from);
    return result;
  },
  async fetch() {

  },
}))
export default componentList;