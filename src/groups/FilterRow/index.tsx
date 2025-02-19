import { IAuto, IBaseComponent } from '@/types/component'
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

export default function CFilterRow({ self, mode, drag, page, source, setSource, children }: IAuto & IBaseComponent) {
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
        {...drag.events}
      >
        {children}
        {self.children.map((child, index) => <Component mode={mode} index={index} page={page} self={child} key={index} source={source} setSource={setSource} setParentHovered={drag?.setIsMouseOver} />)}
      </Wrap>
    )}
  </Observer>
}