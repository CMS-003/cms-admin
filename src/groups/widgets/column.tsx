import React from 'react';
import { ITableWidget } from '@/types';

export default function Widget(props: { widget: ITableWidget }) {
  return <span>
    {props.widget.label}
  </span>
}