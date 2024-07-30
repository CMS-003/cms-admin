import { ITableWidget } from '@/types';

export default function Widget({ widget, mode }: { widget: ITableWidget, mode: string }) {
  return <div style={{ flex: 'auto', minWidth: 100, minHeight: 30, border: mode === 'modify' ? '1px dashed #b0b0b0' : '', ...(mode === 'preview' ? widget.style : {}) }}></div>
}