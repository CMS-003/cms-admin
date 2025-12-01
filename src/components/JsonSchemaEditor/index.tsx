import { Observer, useLocalObservable } from 'mobx-react'
import { FullHeight, FullWidth } from '@/components/style'
import { Checkbox, Input, message, Select, Space } from 'antd'
import Acon from '@/components/Acon';
import "react-contexify/dist/ReactContexify.css";
import SortList from '@/components/SortList/';
import { IJsonSchema } from '@/types';
import { entries, isUndefined, clone } from 'lodash';
import { useEffectOnce } from 'react-use';
import { CSSProperties, Fragment } from 'react';
import './custom.css';
import VisualBox from '../VisualBox';
import styled from 'styled-components'

const Handler = styled.div`
  padding-right: 10px;
`;

type ItemArgvs = {
  parent?: IJsonSchema;
  data: IJsonSchema;
  field: string;
  isRoot?: boolean;
  false_id?: boolean;
  handler: any;
  onChange?: () => void;
}

function Item({
  handler,
  parent,
  data,
  field,
  isRoot = false,
  onChange,
}: ItemArgvs) {
  const local = useLocalObservable(() => ({
    showSub: true,
    get array() {
      return data.type === 'Object' ? entries(data.properties) : [];
    },
    setShowSub(b = false) {
      local.showSub = b
    },
    get is_disabled() {
      return !isUndefined(data.const);
    },
    sortKey(oi: number, ni: number) {
      if (oi === ni) return;
      const keys = clone(local.array);
      const [removed] = keys.splice(oi, 1);
      keys.splice(ni, 0, removed);
      const newProperties: { [key: string]: IJsonSchema } = {};
      keys.forEach(([k, v]) => {
        newProperties[k] = v;
      });
      data.properties = newProperties;
      onChange && onChange();
    },
    renameKey(key: string, newKey: string) {
      if (key === newKey || !parent) return;
      if (parent.properties[newKey]) {
        message.error('字段名已存在');
        return;
      }
      const keys = Object.keys(parent.properties);
      const newProperties: { [key: string]: IJsonSchema } = {};
      keys.forEach(k => {
        if (k === key) {
          newProperties[newKey] = parent.properties[k];
        } else {
          newProperties[k] = parent.properties[k];
        }
      });
      parent.properties = newProperties;
      onChange && onChange();
    }
  }));
  useEffectOnce(() => {
    local.setShowSub((isRoot || data.type === 'Object' && local.array.length > 0) || data.type === 'Array');
  });
  return <Observer>{() => (
    <FullHeight style={{}}>
      <FullWidth style={{ padding: '3px 0' }}>
        {(data.type === 'Object' || data.type === 'Array') && <Acon
          icon='ChevronRight'
          color='#8f8f8f'
          rotate={local.showSub ? '90deg' : '0deg'}
          style={{ marginLeft: -15, transform: 'translate(-10px, 0)' }}
          onClick={() => {
            local.showSub = !local.showSub;
          }}
        />}
        <VisualBox visible={!isRoot}>
          <Handler {...handler} >
            <Acon icon='Move' />
          </Handler>
        </VisualBox>
        <Input className='border-radius-5'
          style={{ flex: 1, marginRight: 8 }}
          defaultValue={field}
          disabled={local.is_disabled || isRoot}
          onBlur={(e) => {
            if (field !== e.target.value) {
              local.renameKey(field, e.target.value);
              onChange && onChange();
            }
          }} />
        <Space size={25} >
          <Checkbox />
          <Select
            className='border-radius-5'
            style={{ width: 100 }}
            dropdownStyle={{ marginTop: -9 }}
            disabled={local.is_disabled || isRoot}
            value={data.type}
            getPopupContainer={(trigger) => trigger.parentNode}
            onChange={value => {
              data.type = value;
              onChange && onChange();
            }}>
            <Select.Option value="ObjectId">ObjectId</Select.Option>
            <Select.Option value="Object">对象</Select.Option>
            <Select.Option value="Array">数组</Select.Option>
            <Select.Option value="String">字符串</Select.Option>
            <Select.Option value="Number">数字</Select.Option>
            <Select.Option value="Date">日期</Select.Option>
            <Select.Option value="Boolean">布尔</Select.Option>
            <Select.Option value="Map">Map</Select.Option>
            <Select.Option value="Mixed">混合</Select.Option>
            <Select.Option value="Buffer">二进制</Select.Option>
            <Select.Option value="Decimal128">高精度</Select.Option>
          </Select>
          <Input className='border-radius-5' placeholder='备注' defaultValue={data.comment} onBlur={value => {
            data.comment = value.target.value;
            onChange && onChange();
          }} suffix={<Acon icon='Edit' />} />
          <Space style={{ width: 100, paddingLeft: 15 }}>
            <Acon icon='Settings' color='#37b332' />
            <VisualBox visible={!(local.is_disabled || isRoot)}>
              <Acon icon='CirclePlus' color='#c80000' rotate='45deg' onClick={() => {
                if (parent) {
                  delete parent.properties[field];
                }
              }} />
            </VisualBox>
            <VisualBox visible={['Object', 'Array'].includes(data.type)}>
              <Acon icon='CirclePlus' color='#36b3f9' onClick={() => {
                if (data.type === 'Object') {
                  if (!data.properties) data.properties = {};
                  const new_field = `field_${local.array.length}`;
                  data.properties[new_field] = { type: 'String', properties: {}, comment: '' };
                } else {
                  if (data.items) {
                    data.items.push({ type: 'String', properties: {}, comment: '' })
                  } else {
                    data.items = [{ type: 'String', properties: {}, comment: '' }]
                  }
                }
                onChange && onChange();
              }} />
            </VisualBox>
          </Space>
        </Space>
      </FullWidth>
      {local.showSub && <Fragment>
        {data.type === 'Object' && <SortList
          items={local.array}
          sort={(oi: number, ni: number) => {
            local.sortKey(oi, ni);
          }}
          droppableId="json-schema-editor"
          itemStyle={{ marginLeft: 20 }}
          renderItem={({ item, handler }: { item: [string, IJsonSchema], handler: any }) => {
            return <Item
              key={item[0]}
              parent={data}
              data={item[1]}
              field={item[0]}
              onChange={onChange}
              handler={handler}
            />
          }}
          mode="edit"
        />}
        {data.type === 'Array' && <div style={{ marginLeft: 30 }}>
          {data.items?.map((v, i) => {
            return <Item key={i} data={v} field={'items'} onChange={onChange} handler={null} />
          }
          )}
        </div>}
      </Fragment>}
    </FullHeight>
  )}</Observer>
}

export default function Editor({ wrapStyle = {}, mainStyle = {}, data, onChange }: { wrapStyle?: CSSProperties, mainStyle?: CSSProperties, data: IJsonSchema, onChange: (data: IJsonSchema) => void }) {
  const store = useLocalObservable(() => ({
    data,
    onChange,
    addField() {
      // store.data.properties.push({ title: '新字段', type: 'string' })
      // store.onChange(store.data)
    },
    removeField(index: number) {
      // store.data.properties.splice(index, 1)
      // store.onChange(store.data)
    },
    updateField(index: number, data: any) {
      // store.data.properties[index] = data
      // store.onChange(store.data)
    }
  }))
  useEffectOnce(() => {

  });
  return <Observer>{() => <div style={{ paddingLeft: 20, ...wrapStyle }}>
    <FullHeight className='json-schema-editor' style={mainStyle}>
      <Item data={store.data} field='root' isRoot={true} handler={null} onChange={() => {
        onChange && onChange(store.data);
      }} />
    </FullHeight>
  </div>}</Observer>

}