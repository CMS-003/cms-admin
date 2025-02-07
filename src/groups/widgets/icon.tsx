import React, { Fragment, useCallback } from 'react';
import { ITableWidget } from '@/types';
import { toJS } from 'mobx';
import Acon from '@/components/Acon';

export default function Widget({ widget, mode }: { widget: ITableWidget, mode: 'preview' | 'modify' }) {
  const handler = useCallback(() => {
    if (widget.onclick) {
      const fn = eval(widget.onclick);
      if (typeof fn === 'function') {
        fn();
      }
    }
  }, [widget.onclick]);
  return <div style={{ whiteSpace: 'nowrap', ...toJS(widget.style) }}><Acon icon={widget.value} />{widget.label}</div>
}