import { Observer, useLocalStore } from 'mobx-react'
import { Menu as ContextMenu, Item as ContextMenuItem, contextMenu } from 'react-contexify';
import { AlignAside, FullHeight, FullWidth } from '@/components/style'
import { Checkbox, Input, message, Select, Space } from 'antd'
import Acon from '@/components/Acon';
import "react-contexify/dist/ReactContexify.css";
import SortList from '@/components/SortList/';
import { IJsonSchema } from '@/types';
import _ from 'lodash';
import { useEffectOnce } from 'react-use';
import { Fragment } from 'react';
import './custom.css';

type ItemArgvs = {
  data: IJsonSchema;
  field: string;
  isRoot?: boolean;
  freeze?: boolean;
  false_id?: boolean;
  onChange?: () => void;
}

function Item({
  data,
  field,
  isRoot = false,
  freeze = false,
  false_id = false,
  onChange,
}: ItemArgvs) {
  const local = useLocalStore(() => ({
    showSub: true,
    get array() {
      return data.type === 'Object' ? _.entries(data.properties) : [];
    },
    setShowSub(b = false) {
      local.showSub = b
    }
  }));
  useEffectOnce(() => {
    local.setShowSub((data.type === 'Object' && local.array.length > 0) || data.type === 'Array');
  });
  return <Observer>{() => (
    <FullHeight style={{}}>
      <FullWidth style={{ marginTop: 5 }}>
        {(data.type === 'Object' || data.type === 'Array') && <Acon
          icon='CaretRightOutlined'
          color='#8f8f8f'
          rotate={local.showSub ? '90deg' : '0deg'}
          style={{ marginLeft: -15, transform: 'translate(-10px, 0)' }}
          onClick={() => {
            local.showSub = !local.showSub;
          }}
        />}
        <Input className='border-radius-5' value={field || ''} style={{ flex: 1, marginRight: 8 }} disabled={freeze || false_id} onChange={e => {
          // data.title = e.target.value
          if (isRoot) {
            data.title = e.target.value;
          } else {
            // TODO: 修改 field
            // data.properties[field] = e.target.value;
          }
          onChange && onChange();
        }} />
        <Space size={25} >
          <Checkbox disabled={freeze} />
          <Select className='border-radius-5' disabled={false_id} value={false_id ? false : data.type} style={{ width: 100 }} onChange={value => {
            if (!false_id) {
              // data.type = value;
            }
            onChange && onChange();
          }}>
            <Select.Option value={false}>false</Select.Option>
            <Select.Option value="Object">对象</Select.Option>
            <Select.Option value="Array">数组</Select.Option>
            <Select.Option value="String">字符串</Select.Option>
            <Select.Option value="Number">数字</Select.Option>
            <Select.Option value="Date">日期</Select.Option>
            <Select.Option value="Boolean">布尔</Select.Option>
          </Select>
          <Input className='border-radius-5' disabled={false_id} placeholder='备注' addonAfter={<Acon icon='FormOutlined' />} onChange={value => {
            data.comment = value.target.value;
            onChange && onChange();
          }} />
          <Space style={{ width: 100, paddingLeft: 15 }}>
            <Acon icon='SettingOutlined' color='#37b332' />
            {!freeze && <Acon icon='PlusOutlined' color='#c80000' rotate='45deg' />}
            <Acon icon='PlusOutlined' color='#36b3f9' />
          </Space>
        </Space>
      </FullWidth>
      {local.showSub && <Fragment>
        {data.type === 'Object' && <SortList
          items={local.array}
          sort={() => {

          }}
          droppableId="json-schema-editor"
          itemStyle={{ marginLeft: 20 }}
          renderItem={({ item }: { item: [string, IJsonSchema] }) => {
            return <Item
              data={item[1]}
              field={item[0]}
              false_id={item[0] === '_id' && (item[1] as any) === false}
              onChange={onChange}
            />
          }}
          mode="preview"
        />}
        {data.type === 'Array' && <div style={{ marginLeft: 30 }}>
          {data.items?.map((v, i) => {
            return <Item key={i} data={v} field={'items'} freeze={true} onChange={onChange} />
          }
          )}
        </div>}
      </Fragment>}
    </FullHeight>
  )}</Observer>
}

export default function Editor({ data, onChange }: { data: IJsonSchema, onChange: (data: IJsonSchema) => void }) {
  const store = useLocalStore(() => ({
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
  return <Observer>{() => <div style={{ width: '50%', margin: '0 auto', paddingLeft: 20 }}>
    <FullHeight className='json-schema-editor'>
      <Item data={store.data} field='root' isRoot={true} onChange={() => {
        onChange && onChange(store.data);
      }} />
    </FullHeight>
  </div>}</Observer>

}