import { Acon } from '@/components'
import { IAuto, IBaseComponent } from '@/types/component'
import { Observer, useLocalObservable } from 'mobx-react'
import { useNavigate } from 'react-router-dom'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { message, Popconfirm } from 'antd'
import { usePageContext } from '../context'
import events from '@/utils/event';
import { pick } from 'lodash';
import CONST from '@/constant'
import apis from '@/api';
import ModalPage from '../modal';

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
  }))
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
        ...dnd?.style,
        flexDirection: self.attrs.layout === 'horizontal' ? 'row' : 'column',
        flex: self.attrs.flex ? 1 : 0,
        display: 'flex',
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      {mode === 'preview' && self.widget.action === CONST.ACTION_TYPE.COPY ? <CopyToClipboard
        text={source[self.widget.field] || self.widget.value}
        onCopy={() => {
          message.success('复制成功', 1)
        }}
      >
        <Acon icon={self.icon || 'PlusOutlined' as any} style={{ width: 24, height: 24, lineHeight: '35px', ...(self.style) }} />
      </CopyToClipboard> :
        (
          self.widget.action === CONST.ACTION_TYPE.DELETE && self.api
            ? <Popconfirm title='确认是否删除' okText='是' cancelText='否' onConfirm={async () => {
              try {
                const result = await apis.destroyData(self.getApi(source._id))
                if (result.code === 0) {
                  events.emit(CONST.ACTION_TYPE.SEARCH, { target: pick(parent || page, ['template_id', 'path', 'param', 'query']) })
                } else {
                  message.warn(result.message);
                }
              } catch (e) {
                console.log(e)
                message.error('操作异常');
              }
            }}>
              <Acon icon={self.icon || 'PlusOutlined' as any} style={{ width: 24, height: 24, ...(self.style) }} />
            </Popconfirm>
            : <Acon icon={self.icon || 'PlusOutlined' as any} style={{ width: 24, height: 24, ...(self.style) }} onClick={async () => {
              if (self.widget.action === CONST.ACTION_TYPE.OPEN_URL) {
                window.open(source[self.widget.field] || self.widget.value)
              } else if (self.widget.action === CONST.ACTION_TYPE.GOTO_PAGE) {
                navigate(`${self.widget.action_url}?id=${source._id}`)
              } else if (self.widget.action === CONST.ACTION_TYPE.MODAL) {
                local.setValue('id', source._id)
                local.setValue('template_id', self.widget.action_url)
              }
            }} />
        )

      }
      {local.template_id && <ModalPage parent={page} template_id={local.template_id} path={`?id=${local.id}`} close={() => { local.setValue('template_id', ''); }} />}
    </div>
  )}</Observer>
}