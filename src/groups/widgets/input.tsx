import React from 'react';
import { ITableWidget } from '@/types';

export default function Widget(props: { widget: ITableWidget }) {
  return <input defaultValue={props.widget.value} />
}