import { IAuto, IBaseComponent } from '@/types/component'
import { UploadOutlined } from '@ant-design/icons'
import { Button, Upload } from 'antd'
import { Observer } from 'mobx-react'
import styled from 'styled-components'
import { ComponentWrap } from '../style';

const Preview = styled.div`
  display: flex;
  flex-direction: column;
  width: 150px;
  height: 150px;
  border-radius: 5px;
  justify-content: center;
  align-items: center;
  background-size: cover;
  background-position: center;
  background-color: lightsteelblue;
`

export default function CUpload({ self, mode, drag, dnd, source = {}, children }: IAuto & IBaseComponent) {
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        ...self.style,
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <Upload>
        <Preview style={{ backgroundImage: source[self.widget.field] ? `url(${source[self.widget.field]})` : '' }}>
          <Button icon={<UploadOutlined />}></Button>
        </Preview>
      </Upload>
    </ComponentWrap>
  )}</Observer>
}