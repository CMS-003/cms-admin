import React from 'react'
import { IComponent } from '@/types/component'
import { SearchOutlined } from '@ant-design/icons'
import styled from 'styled-components'


export default function SearchBtn({ self, mode, children, level }: { self: IComponent, mode: string, children?: any, level: number }) {
  return <div>
    <SearchOutlined />
  </div>
}