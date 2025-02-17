import { IAuto, IBaseComponent } from '@/types/component'
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

export default function CUpload({ self, source = {} }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <Upload>
      <Preview style={{ backgroundImage: source[self.widget.field] ? `url(${source[self.widget.field]})` : '' }}>
        <Button icon={<UploadOutlined />}></Button>
      </Preview>
    </Upload>
  )}</Observer>
}