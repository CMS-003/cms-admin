import { Fragment } from 'react'
import { Acon } from '@/components'
import { FullHeight, FullWidth, } from '@/components/style'
import { IAuto, IBaseComponent } from '@/types/component'
import { Input, Space, Tag } from 'antd'
import { Observer, useLocalObservable } from 'mobx-react'
import { ComponentWrap } from '../style';
import { useEffectOnce } from 'react-use'
import _ from 'lodash'

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
  useEffectOnce(() => {
    if (_.isNil(source[self.widget.field])) {
      setDataField(self.widget, self.widget.value)
    }
  })
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
      <FullHeight>
        <FullWidth style={{ flexWrap: 'wrap' }}>
          {((source[field] || []) as string[]).map((tag, i) => (
            <Tag style={{ margin: '6px 5px 6px 0' }} variant='outlined' key={tag} closable onClose={() => {
              const rest = source[field].filter((v: string) => v !== tag)
              setDataField(self.widget, rest)
            }}>{tag}</Tag>
          ))}
        </FullWidth>
        <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
          {local.addVisible ? (
            <Input value={local.tempTag} style={{ minWidth: 100 }} onChange={e => {
              local.setValue('tempTag', e.target.value)
            }} suffix={<Fragment>
              <Acon icon='CircleCheck' onClick={() => {
                if (local.tempTag && !source[field].includes(local.tempTag)) {
                  const tags = [...source[field], local.tempTag]
                  setDataField(self.widget, tags)
                }
                local.setValue('tempTag', '')
                local.setValue('addVisible', false)
              }} />
              <Acon icon='CircleX' onClick={() => { local.setValue('tempTag', ''); local.setValue('addVisible', false) }} />
            </Fragment>} />
          ) : <span style={{ border: '1px dotted #8b8a8a', borderRadius: 4, lineHeight: 1, padding: '3px 5px' }}>
            <Acon icon='Plus' onClick={() => local.setValue('addVisible', true)} />
          </span>}
        </div>
      </FullHeight>
    </ComponentWrap>
  )}</Observer>
}