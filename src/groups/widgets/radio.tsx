import React, { Fragment } from 'react';
import { Radio } from 'antd';
import { ITableWidget } from '@/types';
import { Observer } from 'mobx-react';

export default function Widget({ widget }: { widget: ITableWidget }) {
  return <Observer>{() => {
    return ((widget.refer || []).map((item: { value: number | string, name: string, checked: boolean }) => (
      <Fragment>
        <Radio key={item.value} value={item.value} checked={widget.value === item.value} onChange={e => {
          widget.value = item.value;
        }}>{item.name}</Radio>
      </Fragment>
    )))
  }}</Observer>
}
