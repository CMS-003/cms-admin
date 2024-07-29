import React from 'react';
import { ITableWidget } from '@/types';
import { Input } from 'antd';

export default function Widget(props: { widget: ITableWidget, mode: string }) {
  return props.mode === 'preview' ? <Input defaultValue={props.widget.value} addonBefore={props.widget.label} /> : <Input value={props.widget.value} addonBefore={props.widget.label} />
}