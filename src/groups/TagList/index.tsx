import { Acon } from '@/components'
import { FullWidth, FullWidthFix } from '@/components/style'
import { IAuto, IBaseComponent } from '@/types/component'
import { Input, Tag } from 'antd'
import { Observer, useLocalStore } from 'mobx-react'
import { Fragment } from 'react'

export default function CTags({ self, mode, source = {}, setSource, drag, dnd, children }: IAuto & IBaseComponent) {
  const local = useLocalStore(() => ({
    addVisible: false,
    tempTag: '',
  }))
  const field = self.widget.field;
  return <Observer>{() => (
    <div
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
      <FullWidth
      >
        {((source[field] || []) as string[]).map((tag, i) => (
          <Tag style={{ margin: '6px 5px 6px 0' }} key={tag} closable onClose={() => {
            if (setSource) {
              const rest = source[field].filter((v: string) => v !== tag)
              console.log(tag, rest, field)
              setSource(field, rest)
            }
          }}>{tag}</Tag>
        ))}
      </FullWidth>
      <div style={{ display: 'flex', alignItems: 'center', width: 150, height: '32px' }}>
        {local.addVisible ? (
          <Input value={local.tempTag} onChange={e => {
            local.tempTag = e.target.value;
          }} addonAfter={(
            <Fragment>
              <Acon icon='check' onClick={() => {
                if (setSource && local.tempTag && !source[field].includes(local.tempTag)) {
                  setSource(field, [...source[field], local.tempTag])
                }
                local.tempTag = '';
                local.addVisible = false;
              }} />
              <Acon icon='close' style={{ marginLeft: 10 }} onClick={() => { local.tempTag = ''; local.addVisible = false }} />
            </Fragment>
          )} />
        ) : <span style={{ border: '1px dashed #8b8a8a', borderRadius: 4, lineHeight: 1, padding: '3px 5px' }}>
          <Acon icon='add' onClick={() => local.addVisible = true} />
        </span>}
      </div>
    </div>
  )}</Observer>
}