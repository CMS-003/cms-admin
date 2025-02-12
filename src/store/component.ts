import { types, IMSTArray, getSnapshot, IAnyModelType } from 'mobx-state-tree'
import { IComponent, IComponentType, IResource } from '@/types'
import _, { } from 'lodash'
import { v4 } from 'uuid'

function validateDate(str: string) {
  const date = Date.parse(str);
  if (isNaN(date)) throw new Error("Invalid date");

  return new Date(date);
}

export const IsoDate = types.custom({
  name: "IsoDate",
  fromSnapshot(value: string) {
    return validateDate(value);
  },
  toSnapshot(value) {
    return value.toISOString();
  },
  isTargetType(maybeDate) {
    return maybeDate instanceof Date;
  },
  getValidationMessage(snapshot) {
    // If we don't throw an error here when the snapshot is faulty (e.g. null),
    // things like types.maybeNull(IsoDate) will not work properly
    try {
      validateDate(snapshot);
      return "";
    } catch (error: any) {
      return error.message;
    }
  }
});
function deepEqual(a: any, b: any) {
  return _.isEqual(a, b);
}

type ComponentItemKeys = 'title' | 'name'

export const ComponentItem = types.model('Component', {
  // 编辑用属性
  $origin: types.frozen({}),
  $selected: types.optional(types.boolean, false),
  $new: types.optional(types.boolean, false),
  _id: types.optional(types.string, ''),
  type: types.optional(types.string, ''),
  template_id: types.optional(types.string, ''),
  project_id: types.optional(types.string, ''),
  parent_id: types.optional(types.string, ''),
  tree_id: types.optional(types.string, ''),
  title: types.optional(types.string, ''),
  name: types.optional(types.string, ''),
  icon: types.optional(types.string, ''),
  cover: types.optional(types.string, ''),
  desc: types.optional(types.string, ''),
  order: types.optional(types.number, 1),
  status: types.optional(types.number, 1),
  createdAt: types.maybe(IsoDate),
  updatedAt: types.maybe(IsoDate),
  style: types.optional(types.frozen(), {}),
  attrs: types.map(types.union(types.string, types.number)),
  widget: types.maybe(types.model({
    field: types.optional(types.string, ''),
    value: types.optional(types.string, ''),
    refer: types.optional(types.array(types.model({ value: types.string, label: types.string })), []),
    action: types.optional(types.string, ''),
    action_url: types.optional(types.string, ''),
  })),
  accepts: types.optional(types.array(types.string), []),
  api: types.optional(types.string, ''),
  resources: types.optional(types.array(types.model({
    _id: types.string,
    title: types.optional(types.string, ''),
    cover: types.optional(types.string, ''),
  })), []),
  children: types.array(types.late((): IAnyModelType => ComponentItem))
}).views(self => ({
  toJSON() {
    const data = getSnapshot(self);
    return _.omit(data, ['data', 'children', '$origin', '$selected', '$new'])
  },
  diff() {
    if (!deepEqual(self.$origin, this.toJSON())) {
      return true;
    }
    return false;
  },
})).actions(self => ({
  setAttr(key: ComponentItemKeys, value: any) {
    self[key] = value;
  },
  setWidget(k: 'field' | 'value', v: string) {
    if (self.widget) {
      self.widget[k] = v;
    }
  },
  pushRefer(t: { label: string, value: string }) {
    self.widget?.refer.push(t);
  },
  remRefer(n: number) {
    self.widget?.refer.splice(n, 1);
  },
  setAttrs(key: string, value: string | number | null) {
    if (value === null) {
      self.attrs.delete(key)
    } else {
      self.attrs.set(key, value)
    }
  },
  updateStyle(s: { [key: string]: number | string }) {
    self.style = s;
  },
  appendChild(type: string) {
    let attrs: any = {};
    if (type === 'MenuItem') {
      attrs.path = '/dynamic'
    }
    self.children.push(ComponentItem.create({
      $origin: {},
      _id: '',
      tree_id: self.tree_id,
      parent_id: self._id,
      project_id: self.project_id,
      template_id: self.template_id,
      type,
      attrs,
      title: '无',
      name: '',
      icon: '',
      cover: '',
      desc: '',
      order: self.children.length,
      status: 1,
      api: '',
      widget: { field: '', value: '', refer: [], action: '' },
      createdAt: new Date(),
      updatedAt: new Date(),
      accepts: self.toJSON().accepts,
      children: [],
    }))
  },
  removeChild(_id: string) {
    const i = self.children.findIndex(c => c._id === _id);
    if (i !== -1) {
      self.children.splice(i, 1);
    } else {
      self.children.forEach(c => {
        c.removeChild(_id);
      })
    }
  },
  addResource(data: IResource) {
    self.resources.push(data)
  },
  remResource(_id: string) {
    const index = self.resources.findIndex(item => item._id === _id);
    if (index > -1) {
      self.resources.splice(index, 1)
    }
  },
  swapResource(oldIndex: number, newIndex: number) {
    if (oldIndex === newIndex) {
      return;
    }
    const [removed] = self.resources.splice(oldIndex, 1);
    const old = getSnapshot(removed);
    self.resources.splice(newIndex, 0, old);
  },
  swap(oldIndex: number, newIndex: number) {
    if (oldIndex === newIndex) {
      return;
    }
    const [removed] = self.children.splice(oldIndex, 1);
    const old = getSnapshot(removed);
    self.children.splice(newIndex, 0, ComponentItem.create(old as IComponent));
    self.children.forEach((child, i) => {
      child.setAttr('order', i);
    })
  },
  afterCreate() {
    if (self._id) {
      self.$origin = self.toJSON() as any;
    } else {
      self.$new = true;
      self._id = v4();
      if (!self.tree_id) {
        self.tree_id = self._id;
      }
    }
  }
}));

const ComponentTypeItem = types.model({
  _id: types.string,
  name: types.string,
  title: types.string,
  cover: types.optional(types.string, ''),
  group: types.optional(types.string, ''),
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
    const com = self.types.find(it => it.name === to);
    if (!com) {
      return false;
    }
    const result = com.accepts.includes(from) || com.accepts.includes('all');
    return result;
  },
  async fetch() {

  },
}))
export default componentList;