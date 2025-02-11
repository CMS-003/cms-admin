import { IComponent } from '@/types/component'
import styled from 'styled-components'

const Icon = styled.img`

`
export default function CIcon({ self, mode, children, level }: { self: IComponent, mode: string, children?: any, level: number }) {
  return <div>
    <Icon src={self.cover} style={{ width: 24, height: 24, ...Object.fromEntries(self.style || {}) }} />
  </div>
}