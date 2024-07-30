import React from 'react';
import { ITableWidget } from '@/types';
import { Input } from 'antd';

export default function Widget(props: { widget: ITableWidget, mode: string }) {
  return props.mode === 'preview' ? <Input.TextArea value={props.widget.value} /> : <Input.TextArea defaultValue={props.widget.value} />
}