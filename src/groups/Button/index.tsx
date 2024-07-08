import { IComponent } from '@/types/component'
import { Image } from 'antd';
import store from '@/store';

export default function Button({ self, mode, children, level }: { self: IComponent, mode: string, children?: any, level: number }) {
  return <div>
    <Image style={{ width: 24, height: 24, }} src={store.app.imageLine + (self.attrs.get('url') || '/images/nocover.jpg')} />
  </div>
}