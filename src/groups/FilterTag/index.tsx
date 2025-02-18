import { IAuto, IBaseComponent } from '@/types/component'
import { Tag } from 'antd'
import { Observer } from 'mobx-react';

export default function ComponentFilterTag({ self, mode, children, drag, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div
      className={`${mode} ${drag?.classNames}`}
      {...drag.events}
    >
      {children}
      <Tag style={(mode === 'edit' ? self.attrs.get('selected') : self.$selected) ? { color: 'white', backgroundColor: '#3498db' } : { color: '#666' }} onClick={() => {
        if ((props as any).onSelect) {
          (props as any).onSelect(self._id);
        }
      }}>{self.title}</Tag>
    </div>
  )}</Observer>
}