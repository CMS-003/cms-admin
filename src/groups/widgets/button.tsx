import React, { useCallback } from 'react';
import { Button } from 'antd';
import { ITableWidget } from '@/types';
import { toJS } from 'mobx';

export default function Widget({ widget, mode, onFetch }: { widget: ITableWidget, mode: 'preview' | 'modify', onFetch?: Function }) {
  const handler = useCallback(() => {
    if (onFetch) {
      onFetch();
    }
    if (widget.onclick) {
      const fn = eval(widget.onclick);
      if (typeof fn === 'function') {
        fn();
      }
    }
  }, [widget.onclick]);
  return mode === 'preview' ? <Button onClick={handler} style={toJS(widget.style || {})}>{widget.label} </Button> : <Button>{widget.label}</Button>
}