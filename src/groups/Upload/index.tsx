import { IAuto, IBaseComponent } from '@/types/component'
import { Button, Input, Upload, message } from 'antd'
import { Observer } from 'mobx-react'
import styled from 'styled-components'
import { ComponentWrap } from '../style';
import { FullHeight } from '@/components/style'
import { useEffect, useRef, useState } from 'react'
import { Acon } from '@/components'
import type { RcFile } from 'antd/es/upload';
import apis from '@/api'
import CONST from '@/constant'

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

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

export default function CUpload({ self, mode, drag, dnd, source = {}, setDataField, children }: IAuto & IBaseComponent) {
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
      <FullHeight style={{ flex: 1 }}>
        <Input
          disabled={loading}
          ref={inputRef}
          style={{ marginBottom: 5 }}
          value={url}
          onChange={e => {
            setURL(e.currentTarget.value)
          }}
          onFocus={() => {
            setFocused(true)
          }}
          onBlur={e => {
            setFocused(false)
            setDataField(self.widget, e.currentTarget.value)
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
          <Preview style={{ backgroundImage: preview || url ? `url(${preview || url})` : '' }}>
            <Acon icon="Upload" />
          </Preview>
        </Upload>
      </FullHeight>
    </ComponentWrap>
  )}</Observer>
}