import { IAuto } from '@/types/component'
import { Observer } from 'mobx-react'
import { Input } from 'antd'

export default function CTextArea({ self, mode, source }: IAuto) {
  return <Observer>{() => (
    <Input.TextArea />
  )}</Observer>
}