import WInput from './input';
import WCheckbox from './checkbox';
import WRadio from './radio';
import WUpload from './upload';
import WColumn from './column';
import { ITableWidget } from '@/types';
import { Observer } from 'mobx-react';

const Widgets = {
  'input': WInput,
  'checkbox': WCheckbox,
  'radio': WRadio,
  'upload': WUpload,
  'column': WColumn,
}

export function Transform({ widget }: { widget: ITableWidget }) {
  const Comp = Widgets[widget.widget as keyof typeof Widgets];
  if (Comp) {
    return <Observer>{() => {
      return <Comp widget={widget} />
    }}</Observer>
  } else {
    return <div>不支持的控件</div>
  }
}