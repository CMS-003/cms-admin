import { FullHeight, FullHeightAuto, FullHeightFix, FullWidth, FullWidthAuto } from '@/components/style'
import { IComponent } from '@/types/component'
import { Tag } from 'antd'
import styled from 'styled-components'
import { Component } from '../auto'
import { PlusOutlined } from '@ant-design/icons'

export default function ComponentFilterRow({ self, mode, children }: { self: IComponent, mode: string, children?: any }) {
  return <FullWidth style={{ marginTop: 8 }}>
    {self.title}:
    {self.children.map(child => <Component self={child} mode={mode} key={child._id} />)}
    {mode === 'edit' && <PlusOutlined />}
  </FullWidth>
}