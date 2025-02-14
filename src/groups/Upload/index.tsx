import { IComponent } from '@/types/component'
import { UploadOutlined } from '@ant-design/icons'
import { Button, Upload } from 'antd'
import { Observer } from 'mobx-react'

export default function ComponentSelect({ self, mode, children, level, source = {} }: { self: IComponent, mode: string, children?: any, level: number, source: any }) {
  return <Observer>{() => (
    <Upload>
      <Button icon={<UploadOutlined />}></Button>
    </Upload>
  )}</Observer>
}