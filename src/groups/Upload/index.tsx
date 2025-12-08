import { IAuto, IBaseComponent } from '@/types/component'
import { Input, Upload, message } from 'antd'
import { Observer } from 'mobx-react'
import styled from 'styled-components'
import { ComponentWrap } from '../style';
import { FullHeight } from '@/components/style'
import { useEffect, useRef, useState } from 'react'
import { Acon } from '@/components'
import type { RcFile } from 'antd/es/upload';
import apis from '@/api'
import CONST from '@/constant'

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

export default function CUpload({ self, drag, source = {}, setDataField, children, mode, page }: IAuto & IBaseComponent) {
  const inputRef = useRef(null);
  const [url, setURL] = useState('')
  const [preview, setPreview] = useState('')
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setURL(source[self.widget.field])
  }, [source[self.widget.field]])
  useEffect(() => {
    if (focused) {
      setTimeout(() => {
        // @ts-ignore
        inputRef.current?.focus();
      }, 0);
    }
  }, [focused])
  return <Observer>{() => (
    <ComponentWrap
      className={drag.className}
      {...drag.events}
      style={self.style}
    >
      {children}
      <FullHeight style={{ flex: 1 }}>
        <Input
          disabled={loading}
          ref={inputRef}
          style={{ marginBottom: 5 }}
          value={url}
          onFocus={() => {
            setFocused(true)
          }}
          onChange={e => {
            setURL(e.currentTarget.value)
          }}
          onBlur={e => {
            setFocused(false)
            setDataField(self.widget, e.currentTarget.value)
            setPreview(e.currentTarget.value)
          }}
          suffix={focused ? <Acon icon="CircleCheck" onClick={() => {
            setFocused(false)
          }} /> : null} />
        <Upload
          showUploadList={false}
          name={self.name || 'file'}
          action={self.url}
          method={self.widget.method as 'post' | 'put'}
          multiple={false}
          disabled={loading || self.widget.action !== CONST.ACTION_TYPE.FETCH}
          onChange={async (info) => {
            if (!self.url || !url) {
              return;
            }
            const reader = new FileReader();
            reader.addEventListener('load', () => {
              setPreview(reader.result as string)
            });
            // @ts-ignore
            reader.readAsDataURL(info.file);
            try {
              const data = new FormData();
              data.append(self.name || 'file', info.file as RcFile)
              data.append('filepath', source[self.widget.field])
              apis.fetch(self.widget.method, self.url, data);
            } catch (e) {
              message.error('上传失败')
            }
          }}
          beforeUpload={() => {
            // 上传前限制判断,返回false需自己处理上传
            return false
          }}
        >
          <Preview style={{ backgroundImage: preview ? `url(${preview})` : '' }}>
            <Acon icon="Upload" />
          </Preview>
        </Upload>
      </FullHeight>
    </ComponentWrap>
  )}</Observer>
}