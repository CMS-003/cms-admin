import React from 'react';
import { ITableWidget } from '@/types';

export default function Widget(props: { widget: ITableWidget }) {
  return <span style={{ whiteSpace: 'nowrap' }}>
    {props.widget.label}
  </span>
}