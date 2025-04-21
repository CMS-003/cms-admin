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
export function mergeQuery(rawUrl: string, additionalQuery: { [key: string]: any }) {
  // 判断是否为完整 URL（包含协议）
  const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(rawUrl);

  // 构造 URL 对象：相对路径需要提供一个 base（location.href 可用）
  const base = window.location.origin;
  const url = hasProtocol ? new URL(rawUrl) : new URL(rawUrl, base);

  // 合并 query 参数
  const params = new URLSearchParams(url.search);
  for (const [key, value] of Object.entries(additionalQuery)) {
    params.set(key, value); // 会覆盖已有 key
  }

  url.search = params.toString();

  // 返回
  return hasProtocol
    ? url.toString()                         // 完整 URL：返回完整的带 host 的 URL
    : url.pathname + url.search;            // 相对路径：去掉 host，只保留路径和 query
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
  attrs: types.optional(types.frozen(), {}),
  widget: types.model({
    field: types.optional(types.string, ''),
    value: types.optional(types.union(types.string, types.number, types.boolean), ''),
    type: types.enumeration(['string', 'number', 'boolean', 'date']),
    in: types.optional(types.string, 'body'),
    refer: types.optional(types.array(types.model({ value: types.union(types.string, types.number, types.boolean), label: types.string })), []),
    action: types.optional(types.string, ''),
    action_url: types.optional(types.string, ''),
  }),
  accepts: types.optional(types.array(types.string), []),
  api: types.optional(types.string, ''),
  resources: types.optional(types.array(types.model({
    _id: types.string,
    title: types.optional(types.string, ''),
    cover: types.optional(types.string, ''),
    poster: types.optional(types.string, ''),
    thumbnail: types.optional(types.string, ''),
    status: types.optional(types.number, 0),
  })), []),
  queries: types.optional(types.array(types.string), []),
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
  getApi(id: string, query?: any) {
    let url = self.api.replace(':id', id || '');
    if (query) {
      url = mergeQuery(url, query)
    }
    return url;
  }
})).actions(self => ({
  setAttr(key: ComponentItemKeys, value: any) {
    self[key] = value;
  },
  setWidget(k: 'field' | 'value' | 'action' | 'action_url', v: string) {
    if (k === 'value') {
      if (self.widget.type === 'boolean') {
        self.widget.value = ['1', 'true', 'TRUE'].includes(v)
      } else if (self.widget.type === 'number') {
        self.widget.value = parseInt(v) || 0
      } else {
        self.widget.value = v;
      }
    } else {
      self.widget[k] = v;
    }
  },
  changeWidgetType(type: 'string' | 'number' | 'boolean') {
    if (type === self.widget.type) {
      return;
    } else if (type === 'number') {
      self.widget.value = parseInt(self.widget.value as string);
      self.widget.refer.forEach(r => r.value = parseInt(r.value as string));
    } else if (type === 'boolean') {
      self.widget.value = ['1', 'true', 'TRUE'].includes(self.widget.value as any) as boolean;
    } else {
      self.widget.value = self.widget.value.toString();
      self.widget.refer.forEach(r => r.value = r.value.toString());
    }
    self.widget.type = type;
  },
  pushRefer(t: { label: string, value: string }) {
    let v: any = t.value;
    if (self.widget.type === 'boolean') {
      v = ['1', 'true', 'TRUE'].includes(v)
    } else if (self.widget.type === 'number') {
      v = parseInt(v) || 0
    }
    t.value = v;
    self.widget.refer.push(t);
  },
  remRefer(n: number) {
    self.widget.refer.splice(n, 1);
  },
  setAttrs(key: string, value: string | number | null) {
    const attr = _.cloneDeep(self.attrs);
    if (value === null) {
      delete attr[key]
    } else {
      attr[key] = value
    }
    self.attrs = attr;
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
      style: {},
      title: '无',
      name: '',
      icon: '',
      cover: '',
      desc: '',
      order: self.children.length,
      status: 1,
      api: '',
      widget: { field: '', value: '', type: 'string', refer: [], action: '' },
      createdAt: new Date(),
      updatedAt: new Date(),
      accepts: self.toJSON().accepts,
      children: [],
    }))
    return self.children[self.children.length - 1];
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
      self.$origin = self.$new ? {} : self.toJSON() as any;
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
  status: types.optional(types.number, 0),
  cover: types.optional(types.string, ''),
  group: types.optional(types.string, ''),
  accepts: types.array(types.string),
})

const component = types.model({
  list: types.array(ComponentItem),
  types: types.array(ComponentTypeItem),
  editing_component_id: types.optional(types.string, ''),
  hover_component_id: types.optional(types.string, ''),
  dragingType: types.optional(types.string, ''),
  dragingWidgetType: types.optional(types.string, ''),
  can_drag_id: types.optional(types.string, ''),
  isDragging: types.optional(types.boolean, false),
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
  setEditComponentId(id: string) {
    self.editing_component_id = id;
  },
  setHoverComponentId(id: string) {
    self.hover_component_id = id
  },
  setDragType(type: string) {
    self.dragingType = type;
  },
  setDragWidgetType(type: string) {
    self.dragingWidgetType = type;
  },
  setCanDragId(id: string) {
    self.can_drag_id = id;
  },
  setIsDragging(bool: boolean) {
    self.isDragging = bool;
  },
  async fetch() {

  },
}))
export default component;