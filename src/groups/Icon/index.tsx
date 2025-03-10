import { Acon } from '@/components'
import { IAuto, IBaseComponent } from '@/types/component'
import { Observer } from 'mobx-react'
import { useNavigate } from 'react-router-dom'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { message } from 'antd'
import { usePageContext } from '../context'
import events from '@/utils/event';
import { pick } from 'lodash';
import CONST from '@/constant'
import apis from '@/api';

export default function CIcon({ self, mode, drag, dnd, source, children }: IAuto & IBaseComponent) {
  const navigate = useNavigate();
  const page = usePageContext()
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
      {mode === 'preview' && self.widget.action === CONST.ACTION_TYPE.COPY ? <CopyToClipboard
        text={source[self.widget.field] || self.widget.value}
        onCopy={() => {
          if (self.widget.action === CONST.ACTION_TYPE.COPY) {
            message.success('复制成功', 1)
          }
        }}
      >
        <Acon icon={self.icon || 'PlusOutlined' as any} style={{ width: 24, height: 24, ...(self.style) }} />
      </CopyToClipboard> :
        <Acon icon={self.icon || 'PlusOutlined' as any} style={{ width: 24, height: 24, ...(self.style) }} onClick={async () => {
          if (self.widget.action === CONST.ACTION_TYPE.OPEN_URL) {
            window.open(source[self.widget.field] || self.widget.value)
          } else if (self.widget.action === CONST.ACTION_TYPE.GOTO_PAGE) {
            navigate(`${self.widget.action_url}?id=${source._id}`)
          } else if (self.widget.action === CONST.ACTION_TYPE.DELETE && self.api) {
            try {
              const result = await apis.destroyData(self.api, self._id)
              if (result.code === 0) {
                events.emit(CONST.ACTION_TYPE.SEARCH, { target: pick(page, ['template_id', 'path', 'param', 'query']) })
              } else {
                message.warn(result.message);
              }
            } catch (e) {
              console.log(e)
            }

          }
        }} />
      }

    </div>
  )}</Observer>
}