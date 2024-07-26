import React from 'react';
import { Button } from 'antd';
import { ITableWidget } from '@/types';

export default function Widget({ widget }: { widget: ITableWidget }) {
  return <Button type='primary'>{widget.label} </Button>
}