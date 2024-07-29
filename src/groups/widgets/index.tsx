import WInput from './input';
import WCheckbox from './checkbox';
import WRadio from './radio';
import WUpload from './upload';
import WColumn from './column';
import WButton from './button';
import WSearch from './search';
import WSelect from './select';
import { ITableWidget } from '@/types';
import { Observer } from 'mobx-react';

const Widgets = {
  'input': WInput,
  'checkbox': WCheckbox,
  'radio': WRadio,
  'upload': WUpload,
  'column': WColumn,
  'button': WButton,
  'search': WSearch,
  'select': WSelect,
}

export function Transform({ widget, mode }: { widget: ITableWidget, mode: 'preview' | 'modify' }) {
  const Comp = Widgets[widget.widget as keyof typeof Widgets];
  if (Comp) {
    return <Observer>{() => {
      return <Comp widget={widget} mode={mode} />
    }}</Observer>
  } else {
    return <div>不支持的控件</div>
  }
}