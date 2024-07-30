import React, { useEffect, useRef } from 'react';
import { ITableWidget } from '@/types';
import { Input } from 'antd';
import { Observer } from 'mobx-react';

export default function Widget(props: { widget: ITableWidget, mode: string }) {
  return <Observer>{() => {
    return props.mode === 'preview' ? <Input style={{ width: 'auto' }} value={props.widget.value} addonBefore={props.widget.label} onChange={e => {
      props.widget.value = e.target.value;
    }} /> : <Input value={props.widget.value} addonBefore={props.widget.label} />
  }}</Observer>
}