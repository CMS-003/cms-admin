import React from 'react';
import { ITableWidget } from '@/types';
import { Input } from 'antd';

export default function Widget(props: { widget: ITableWidget }) {
  return <Input addonBefore={props.widget.label} value={props.widget.value} />
}