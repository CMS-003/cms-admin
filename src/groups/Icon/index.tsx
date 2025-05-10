import { Acon, VisualBox } from '@/components'
import { IAuto, IBaseComponent } from '@/types/component'
import { Observer, useLocalObservable } from 'mobx-react'
import { useNavigate } from 'react-router-dom'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { message, Popconfirm, Popover } from 'antd'
import { usePageContext } from '../context'
import events from '@/utils/event';
import { pick } from 'lodash';
import CONST from '@/constant'
import apis from '@/api';
import ModalPage from '../modal';
import { ComponentWrap } from '../style';
import { useCallback } from 'react';
import store from '@/store';
import hbs from 'handlebars'

export default function CIcon({ self, mode, drag, dnd, source, children, parent }: IAuto & IBaseComponent) {
  const navigate = useNavigate();
  const page = usePageContext();
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
      const result = await apis.fetch(self.widget.method, self.getApi(source._id))
      if (result.code === 0) {
        events.emit(CONST.ACTION_TYPE.SEARCH, { target: pick(parent || page, ['template_id', 'path', 'param', 'query']) })
      } else {
        message.warn(result.message);
      }
    } catch (e) {
      console.log(e)
      message.error('操作异常');
    }
  }, [])
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        ...dnd?.style,
        flex: self.attrs.flex ? 1 : 0,
        display: 'flex',
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
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
          <Acon icon={self.icon || 'PlusOutlined' as any} style={self.style} />
        </CopyToClipboard>
      </VisualBox>
      <VisualBox visible={self.widget.action === CONST.ACTION_TYPE.FETCH}>
        {self.attrs.confirm
          ? <Popconfirm title='确认是否删除' okText='是' cancelText='否' onConfirm={async () => {
            await request()
          }}>
            <Acon icon={self.icon || 'PlusOutlined' as any} style={self.style} />
          </Popconfirm>
          : <Acon icon={self.icon || 'PlusOutlined' as any} style={self.style} onClick={async () => {
            await request()
          }} />}
      </VisualBox>
      <VisualBox visible={self.widget.action === CONST.ACTION_TYPE.OPEN_URL}>
        <Acon icon={self.icon || 'PlusOutlined' as any} style={self.style} onClick={async () => {
          const url = hbs.compile(self.url)(source)
          window.open(url)
        }} />
      </VisualBox>
      <VisualBox visible={self.widget.action === CONST.ACTION_TYPE.GOTO_PAGE}>
        <Acon icon={self.icon || 'PlusOutlined' as any} style={self.style} onClick={async () => {
          navigate(`${self.url}?id=${source._id}`)
        }} />
      </VisualBox>
      <VisualBox visible={self.widget.action === CONST.ACTION_TYPE.MODAL}>
        <Acon icon={self.icon || 'PlusOutlined' as any} style={self.style} onClick={async () => {
          local.setValue('id', source._id)
          local.setValue('template_id', self.widget.method)
        }} />
      </VisualBox>
      <VisualBox visible={self.widget.action === CONST.ACTION_TYPE.PREVIEW && self.widget.method === 'image'}>
        <Popover trigger='click' content={<div>
          <img src={store.app.imageLine + source[self.widget.field]} style={{ height: 100 }} />
        </div>}>
          <Acon icon={self.icon || 'FileSearchOutlined' as any} style={self.style} />
        </Popover>
      </VisualBox>
      <VisualBox visible={self.widget.action === ''}>
        <Acon icon={self.icon || 'PlusOutlined' as any} style={self.style} />
      </VisualBox>
      {local.template_id && <ModalPage parent={page} template_id={local.template_id} path={`?id=${local.id}`} close={() => { local.setValue('template_id', ''); }} />}
    </ComponentWrap>
  )}</Observer>
}