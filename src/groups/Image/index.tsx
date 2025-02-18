import { IAuto, IBaseComponent } from '@/types/component'
import { Image } from 'antd';
import store from '@/store';
import { Observer } from 'mobx-react';

export default function CImage({ self, mode, drag, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div
      className={`${mode} ${drag?.classNames}`}
      {...drag.events}
    >
      {children}
      <Image style={{ width: 24, height: 24, }} src={store.app.imageLine + (self.attrs.get('url') || '/images/nocover.jpg')} />
    </div>
  )}</Observer>
}