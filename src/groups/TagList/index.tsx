import { Acon } from '@/components'
import { FullWidth } from '@/components/style'
import { IResource } from '@/types'
import { IComponent } from '@/types/component'
import { Tag } from 'antd'
import { Observer } from 'mobx-react'

export default function ComponentSelect({ self, mode, children, level, source = {} }: { self: IComponent, mode: string, children?: any, level: number, source: any }) {
  return <Observer>{() => (
    <FullWidth style={{ alignItems: 'center' }}>
      {((source[self.widget?.field || ''] || []) as string[]).map((r, i) => (
        <Tag title={r} key={i} />
      ))}
      <span style={{ border: '1px dashed #8b8a8a', borderRadius: 4, lineHeight: 1.5, padding: '3px 5px' }}>
        <Acon icon='add' />
      </span>
    </FullWidth>
  )}</Observer>
}