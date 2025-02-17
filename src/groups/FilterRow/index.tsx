import { IAuto, IComponent } from '@/types/component'
import styled from 'styled-components'
import { Component } from '../auto'
import Acon from '@/components/Acon'
import SortList from '@/components/SortList'
import { Observer } from 'mobx-react'
import { ScrollWrap } from '../style'
import { useEffectOnce } from 'react-use'

const Wrap = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  overflow-x: auto;
  &::-webkit-scrollbar {
    display: none;
  }
`

export default function CFilterRow({ self, mode, drag, page, source, setSource, children }: IAuto) {
  useEffectOnce(() => {
    self.children.forEach(child => {
      if (child.attrs.get('selected')) {
        child.setAttr('$selected', true)
      }
    })
  })
  return <Observer>
    {() => (
      <Wrap key={self.children.length}
        className={`${mode} ${drag?.classNames}`}
        onMouseEnter={drag?.onMouseEnter || ((e) => { })}
        onMouseLeave={drag?.onMouseLeave || ((e) => { })}
        onContextMenu={drag?.onContextMenu || ((e) => { })}
        onDragOver={drag?.onDragOver || ((e) => { })}
        onDrop={drag?.onDrop || ((e) => { })}
        onDragLeave={drag?.onDragLeave || ((e) => { })}>
        {children}
        {self.children.map((child, index) => <Component mode={mode} page={page} self={child} key={index} source={source} setSource={setSource} setParentHovered={drag?.setIsMouseOver} />)}
      </Wrap>
    )}
  </Observer>
}