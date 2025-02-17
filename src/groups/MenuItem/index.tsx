import { IAuto, } from '@/types/component'
import styled from 'styled-components'
import Acon, { Icon } from '@/components/Acon'
import { Component } from '../auto'
import { Observer } from 'mobx-react'

const MenuItem = styled.div`
  color: #333;
  cursor: pointer;
  padding: 10px;
  &:hover {
    background-color: ${props => props.className === 'edit' ? 'transparent' : '#71ace3'};
  }
`
export default function CMenuItem({ self, mode, drag, children, }: IAuto) {
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
      <MenuItem className={mode}><Acon icon={self.icon as Icon} style={{ marginRight: 5 }} />{self.title}</MenuItem>
      <div style={{ paddingLeft: 24 }}>
        {self.children.map((child, i) => <Component
          key={i}
          self={child}
          mode={mode}
          setParentHovered={drag?.setIsMouseOver}
        />)}
      </div>
    </div>
  )}</Observer>
}