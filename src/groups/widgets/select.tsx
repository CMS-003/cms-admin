import React, { Fragment } from 'react';
import { Select } from 'antd';
import { ITableWidget } from '@/types';
import { Observer } from 'mobx-react';
import { FullWidth } from '@/components/style';

export default function Widget({ widget }: { widget: ITableWidget }) {
  return <Observer>{() => {
    return <FullWidth>
      <div style={{ padding: '0 10px', whiteSpace: 'nowrap' }}>{widget.label}</div>
      <Select value={widget.value} onChange={v => {
        widget.value = v;
      }}>
        {(widget.refer || []).map((item: any, i: number) => (
          <Select.Option key={i} value={item.value}>{item.name}</Select.Option>
        ))}
      </Select>
    </FullWidth>
  }}</Observer>
}
