import { IAuto } from '@/types/component'
import { Observer } from 'mobx-react'
import styled from 'styled-components'

const Icon = styled.img`

`
export default function CIcon({ self, mode, drag, children }: IAuto) {
  return <Observer>{() => (
    <div
      className={`${mode} ${drag?.classNames}`}
      onMouseEnter={drag?.onMouseEnter || ((e) => { })}
      onMouseLeave={drag?.onMouseLeave || ((e) => { })}
      onContextMenu={drag?.onContextMenu || ((e) => { })}
      onDragOver={drag?.onDragOver || ((e) => { })}
      onDrop={drag?.onDrop || ((e) => { })}
      onDragLeave={drag?.onDragLeave || ((e) => { })}>
      {children}
      <Icon src={self.cover} style={{ width: 24, height: 24, ...(self.style) }} />
    </div>
  )}</Observer>
}