import React, { Fragment } from 'react';
import { Checkbox } from 'antd';
import { ITableWidget } from '@/types';
import { Observer } from 'mobx-react';

export default function Widget({ widget }: { widget: ITableWidget }) {
  return <Observer>{() => {
    return ((widget.refer || []).map((item: { value: number | string, name: string, checked: boolean }) => (
      <Fragment>
        <Checkbox value={item.value} checked={item.checked} onChange={e => {
          item.checked = e.target.checked;
        }} /> {item.name}
      </Fragment>
    )))
  }}</Observer>
}
