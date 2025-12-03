import { Acon, VisualBox } from '@/components'
import { IAuto, IBaseComponent } from '@/types/component'
import { Observer, useLocalObservable } from 'mobx-react'
import { useNavigate } from 'react-router-dom'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { message, Popconfirm, Popover, Upload, notification } from 'antd'
import events from '@/utils/event';
import { pick, isEmpty } from 'lodash-es';
import CONST from '@/constant'
import apis from '@/api';
import ModalPage from '../modal';
import { ComponentWrap } from '../style';
import { useCallback, useState } from 'react';
import store from '@/store';
import hbs from 'handlebars'
import type { RcFile } from 'antd/es/upload';
import styled from 'styled-components'

const Preview = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 5px;
  justify-content: center;
  align-items: center;
  background-size: cover;
  background-position: center;
  background-color: lightsteelblue;
`

export default function CIcon({ self, drag, source, children, parent, mode, page }: IAuto & IBaseComponent) {
  const navigate = useNavigate();
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const local = useLocalObservable(() => ({
    template_id: '',
    id: '',
    setValue(k: string, v: string) {
      if (k === 'template_id') {
        local.template_id = v
      } else if (k === 'id') {
        local.id = v;
      }
    }
  }));
  const request = useCallback(async () => {
    try {
      if (self.widget.action !== CONST.ACTION_TYPE.FETCH) {
        return;
      }
      // pick/omit keys
      const result = await apis.fetch(self.widget.method, self.getApi(source._id), isEmpty(self.widget.refer) ? source : pick(source, self.widget.refer.map(r => r.value as string)))
      if (result.code === 0) {
        events.emit(CONST.ACTION_TYPE.SEARCH, { target: pick(parent || page, ['template_id', 'path', 'param', 'query']) })
        notification.info({ title: '请求成功', placement: 'topRight' })
      } else {
        message.warning(result.message);
      }
    } catch (e) {
      console.log(e)
      message.error('操作异常');
    }
  }, [])
  return <Observer>{() => (
    <ComponentWrap
      className={drag.className}
      {...drag.events}
      style={{
        display: 'flex',
        ...self.style,
      }}
    >
      {children}
      <VisualBox visible={self.widget.action === CONST.ACTION_TYPE.COPY}>
        <CopyToClipboard
          text={source[self.widget.field] || self.widget.value}
          onCopy={() => {
            message.success('复制成功', 1)
          }}
        >
          <Acon icon={self.icon || 'CirclePlus' as any} style={self.style} title={self.title} />
        </CopyToClipboard>
      </VisualBox>
      <VisualBox visible={self.widget.action === CONST.ACTION_TYPE.FETCH}>
        {self.attrs.confirm
          ? <Popconfirm title='确认是否删除' okText='是' cancelText='否' onConfirm={async () => {
            await request()
          }}>
            <Acon icon={self.icon || 'CirclePlus' as any} style={self.style} title={self.title} />
          </Popconfirm>
          : <Acon icon={self.icon || 'CirclePlus' as any} style={self.style} title={self.title} onClick={async () => {
            await request()
          }} />}
      </VisualBox>
      <VisualBox visible={self.widget.action === CONST.ACTION_TYPE.UPLOAD}>
        <Upload
          showUploadList={false}
          name={self.name || 'file'}
          action={self.url}
          method={self.widget.method as 'post' | 'put'}
          multiple={false}
          disabled={loading || self.widget.action !== CONST.ACTION_TYPE.UPLOAD}
          onChange={async (info) => {
            if (!source[self.widget.field]) {
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
          <Preview style={{ backgroundImage: `url(${preview})` }}>
            <Acon icon="Upload" style={self.style} />
          </Preview>
        </Upload>
      </VisualBox>
      <VisualBox visible={self.widget.action === CONST.ACTION_TYPE.OPEN_URL}>
        <Acon icon={self.icon} style={self.style} title={self.title} onClick={async () => {
          const url = hbs.compile(self.url)(source)
          window.open(url)
        }} />
      </VisualBox>
      <VisualBox visible={self.widget.action === CONST.ACTION_TYPE.GOTO_PAGE}>
        <Acon icon={self.icon} style={self.style} title={self.title} onClick={async () => {
          navigate(`${self.url}?id=${source._id}`)
        }} />
      </VisualBox>
      <VisualBox visible={self.widget.action === CONST.ACTION_TYPE.MODAL}>
        <Acon icon={self.icon || 'CirclePlus' as any} style={self.style} title={self.title} onClick={async () => {
          local.setValue('id', source._id)
          local.setValue('template_id', self.widget.method)
        }} />
      </VisualBox>
      <VisualBox visible={self.widget.action === CONST.ACTION_TYPE.PREVIEW}>
        <Popover trigger='click' content={<div>
          {self.widget.method === 'image' ? <img src={store.app.imageLine + source[self.widget.field]} style={{ height: 100 }} /> : <video controls src={store.app.videoLine + source[self.widget.field]} style={{ height: 300 }} />}
        </div>}>
          <Acon icon={self.icon || 'FileSearch' as any} title={self.title} style={self.style} />
        </Popover>
      </VisualBox>
      <VisualBox visible={self.widget.action === ''}>
        <Acon icon={self.icon || 'CirclePlus' as any} title={self.title} style={self.style} />
      </VisualBox>
      {local.template_id && <ModalPage parent={page} template_id={local.template_id} path={`?id=${local.id}`} close={() => { local.setValue('template_id', ''); }} />}
    </ComponentWrap>
  )
  }</Observer >
}