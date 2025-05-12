import { Acon } from '@/components'
import { FullWidth, } from '@/components/style'
import { IAuto, IBaseComponent } from '@/types/component'
import { Input, Tag } from 'antd'
import { Observer, useLocalObservable } from 'mobx-react'
import { ComponentWrap } from '../style';

export default function CTagList({ self, mode, source = {}, setDataField, drag, dnd, children }: IAuto & IBaseComponent) {
  const local = useLocalObservable(() => ({
    addVisible: false,
    tempTag: '',
    setValue(field: 'tempTag' | 'addVisible', v: string | boolean) {
      if (field === 'tempTag') {
        local.tempTag = v as string;
      } else if (field === 'addVisible') {
        local.addVisible = v as boolean;
      }
    }
  }))
  const field = self.widget.field;
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        flexDirection: 'row',
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      <FullWidth style={{ flexWrap: 'wrap' }}>
        {((source[field] || []) as string[]).map((tag, i) => (
          <Tag style={{ margin: '6px 5px 6px 0' }} key={tag} closable onClose={() => {
            const rest = source[field].filter((v: string) => v !== tag)
            setDataField(self.widget, rest)
          }}>{tag}</Tag>
        ))}
      </FullWidth>
      <div style={{ display: 'flex', alignItems: 'center', width: 150, height: '32px' }}>
        {local.addVisible ? (
          <Input value={local.tempTag} onChange={e => {
            local.setValue('tempTag', e.target.value)
          }} addonAfter={(
            <FullWidth>
              <Acon icon='check' onClick={() => {
                if (local.tempTag && !source[field].includes(local.tempTag)) {
                  setDataField(self.widget, [...source[field], local.tempTag])
                }
                local.setValue('tempTag', '')
                local.setValue('addVisible', false)
              }} />
              <Acon icon='close' style={{ marginLeft: 10 }} onClick={() => { local.setValue('tempTag', ''); local.setValue('addVisible', false) }} />
            </FullWidth>
          )} />
        ) : <span style={{ border: '1px dotted #8b8a8a', borderRadius: 4, lineHeight: 1, padding: '3px 5px' }}>
          <Acon icon='add' onClick={() => local.setValue('addVisible', true)} />
        </span>}
      </div>
    </ComponentWrap>
  )}</Observer>
}