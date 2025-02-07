import { types, IType, IModelType, IMSTArray, SnapshotIn, SnapshotOut } from 'mobx-state-tree'
import { IWidget, ITableWidget } from '@/types'

export const WidgetType = types.model('WidgetType', {
  _id: types.string,
  title: types.optional(types.string, ''),
  cover: types.optional(types.string, ''),
  desc: types.optional(types.string, ''),
  order: types.optional(types.number, 1),
  status: types.optional(types.number, 1),
});

const Widget = types.model({
  list: types.array(WidgetType),
}).views(self => ({
  getList(): IWidget[] {
    return self.list.toJSON();
  },
  getViewWidgetByType(type: string): ITableWidget {
    let value: any = '';
    let refer: any = '';
    switch (type) {
      case 'input':
        value = '';
        break;
      case 'checkbox':
        value = '';
        refer = [
          { value: 'apple', name: '苹果', },
          { value: 'banana', name: '香蕉', },
        ];
        break;
      case 'radio':
        value = '';
        refer = [{ value: 'apple', name: '苹果' }, { value: 'banana', name: '香蕉' }];
        break;
      case 'search':
        value = '条件';
        break;
      case 'select':
        value = 'success';
        refer = [
          { value: 'success', name: '成功' },
          { value: 'fail', name: '失败' },
        ]
        break;
      default: break;
    }
    return {
      _id: '',
      field: '',
      label: '字段',
      widget: type,
      value,
      source: 'var',
      refer,
      explain: '',
      template: '',
      style: {},
      widgets: [],
    };
  }
})).actions((self) => ({
  setList(items: IWidget[]) {
    self.list.replace(items);
  },
  async fetch() {

  },
}))
export default Widget;