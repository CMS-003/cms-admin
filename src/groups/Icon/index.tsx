import { Acon } from '@/components'
import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { message } from 'antd'
import CONST from '@/constant'

export default function CIcon({ self, mode, drag, dnd, source, children }: IAuto & IBaseComponent) {
  const navigate = useNavigate();
  return <Observer>{() => (
    <div
      className={mode + drag.className}
      onClick={() => {
        if (self.widget.action === CONST.ACTION_TYPE.GOTO_PAGE) {
          navigate(`${self.widget.action_url}?id=${source._id}`)
        }
      }}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        lineHeight: '35px',
        ...self.style,
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      {mode === 'preview' ? <CopyToClipboard
        text={source[self.widget.field] || self.widget.value}
        onCopy={() => {
          if (self.widget.action === CONST.ACTION_TYPE.COPY) {
            message.success('复制成功', 1)
          }
        }}
      >
        <Acon icon={self.icon || 'PlusOutlined' as any} style={{ width: 24, height: 24, ...(self.style) }} onClick={() => {
          if (self.widget.action === CONST.ACTION_TYPE.OPEN_URL) {
            window.open(source[self.widget.field] || self.widget.value)
          } else if (self.widget.action === CONST.ACTION_TYPE.GOTO_PAGE) {
            navigate(`${self.widget.action_url}?id=${source._id}`)
          }
        }} />
      </CopyToClipboard> :
        <Acon icon={self.icon || 'PlusOutlined' as any} style={{ width: 24, height: 24, ...(self.style) }} onClick={() => {
          if (self.widget.action === CONST.ACTION_TYPE.OPEN_URL) {
            window.open(source[self.widget.field] || self.widget.value)
          } else if (self.widget.action === CONST.ACTION_TYPE.GOTO_PAGE) {
            navigate(`${self.widget.action_url}?id=${source._id}`)
          } else if (self.widget.action === CONST.ACTION_TYPE.UPDATE && self.widget.action_url) {

          }
        }} />
      }

    </div>
  )}</Observer>
}