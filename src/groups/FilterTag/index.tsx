import { IAuto, IBaseComponent } from '@/types/component'
import { Tag } from 'antd'
import { Observer } from 'mobx-react';
import { ComponentWrap } from '../style';

export default function ComponentFilterTag({ self, mode, children, drag, ...props }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      style={{
        flex: 0,
        height: 24,
      }}
    >
      {children}
      <Tag variant='outlined' style={(mode === 'edit' ? self.attrs.selected : self.$selected) ? { color: 'white', backgroundColor: '#3498db' } : { color: '#666' }} onClick={() => {
        if ((props as any).onSelect) {
          (props as any).onSelect(self._id);
        }
      }}>{self.title}</Tag>
    </ComponentWrap>
  )}</Observer>
}