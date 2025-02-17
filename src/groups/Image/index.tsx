import { IAuto, IBaseComponent} from '@/types/component'
import { Image } from 'antd';
import store from '@/store';
import { Observer } from 'mobx-react';

export default function CImage({ self, mode, drag, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <div
      className={`${mode} ${drag?.classNames}`}
      onMouseEnter={drag?.onMouseEnter || ((e) => { })}
      onMouseLeave={drag?.onMouseLeave || ((e) => { })}
      onContextMenu={drag?.onContextMenu || ((e) => { })}
      onDragOver={drag?.onDragOver || ((e) => { })}
      onDrop={drag?.onDrop || ((e) => { })}
      onDragLeave={drag?.onDragLeave || ((e) => { })}>
      {children}
      <Image style={{ width: 24, height: 24, }} src={store.app.imageLine + (self.attrs.get('url') || '/images/nocover.jpg')} />
    </div>
  )}</Observer>
}