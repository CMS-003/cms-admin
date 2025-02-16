import { IAuto } from '@/types/component'
import { Image } from 'antd';
import store from '@/store';

export default function CImage({ self }: IAuto) {
  return <div>
    <Image style={{ width: 24, height: 24, }} src={store.app.imageLine + (self.attrs.get('url') || '/images/nocover.jpg')} />
  </div>
}