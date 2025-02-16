import { IAuto } from '@/types/component'
import { Button } from 'antd'

export default function CButton({ self }: IAuto) {
  return <div>
    <Button type={self.attrs.get('type') || 'primary'}>{self.title}</Button>
  </div>
}