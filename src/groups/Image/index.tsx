import { IAuto, IBaseComponent } from '@/types/component'
import { Image } from 'antd';
import store from '@/store';
import { Observer } from 'mobx-react';
import { ComponentWrap } from '../style';
import { useModeContext } from '../context';

export default function CImage({ self, drag, source, children, mode, page }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <ComponentWrap
      className={drag.className}
      {...drag.events}
    >
      {children}
      <Image preview={false} style={{ ...self.style }} src={store.app.imageLine + (source ? source[self.widget.field] || '/images/nocover.jpg' : '/images/nocover.jpg')} />
    </ComponentWrap>
  )}</Observer>
}