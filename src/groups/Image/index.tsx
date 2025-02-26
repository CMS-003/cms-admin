import { IAuto, IBaseComponent } from '@/types/component'
import { Image } from 'antd';
import store from '@/store';
import { Observer } from 'mobx-react';

export default function CImage({ self, mode, drag, dnd, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.draggableProps}
      {...dnd?.dragHandleProps}
      style={{
        ...dnd?.style,
      }}
    >
      {children}
      <Image style={{ width: 24, height: 24, }} src={store.app.imageLine + (self.attrs.get('url') || '/images/nocover.jpg')} />
    </div>
  )}</Observer>
}