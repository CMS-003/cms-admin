import { IAuto, IBaseComponent } from '@/types/component'
import { Image } from 'antd';
import store from '@/store';
import { Observer } from 'mobx-react';
import { ComponentWrap } from '../style';

export default function CImage({ self, mode, drag, dnd, source, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <Image preview={false} style={{ ...self.style }} src={store.app.imageLine + (source ? source[self.widget.field] || '/images/nocover.jpg' : '/images/nocover.jpg')} />
    </ComponentWrap>
  )}</Observer>
}