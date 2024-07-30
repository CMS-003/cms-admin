import React from 'react';
import { ITableWidget } from '@/types';
import { Input } from 'antd';

export default function Widget(props: { widget: ITableWidget, mode: string }) {
  return props.mode === 'preview' ? <Input defaultValue={props.widget.value} onChange={e => {
    props.widget.value = e.target.value;
  }} /> : <Input defaultValue={props.widget.value} />
}