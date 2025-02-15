import { IComponent } from '@/types/component'
import { UploadOutlined } from '@ant-design/icons'
import { Button, Upload } from 'antd'
import { Observer } from 'mobx-react'
import styled from 'styled-components'

const Preview = styled.div`
  display: flex;
  flex-direction: column;
  width: 200px;
  height: 200px;
  justify-content: center;
  align-items: center;
  background-size: cover;
  background-position: center;
  background-color: lightsteelblue;
`

export default function ComponentSelect({ self, mode, children, level, source = {} }: { self: IComponent, mode: string, children?: any, level: number, source: any }) {
  return <Observer>{() => (
    <Upload>
      <Preview style={{ backgroundImage: `url(${source[self.widget?.field || '']})` }}>
        <Button icon={<UploadOutlined />}></Button>
      </Preview>
    </Upload>
  )}</Observer>
}