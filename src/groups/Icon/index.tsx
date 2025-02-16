import { IAuto } from '@/types/component'
import styled from 'styled-components'

const Icon = styled.img`

`
export default function CIcon({ self }:IAuto) {
  return <div>
    <Icon src={self.cover} style={{ width: 24, height: 24, ...(self.style) }} />
  </div>
}