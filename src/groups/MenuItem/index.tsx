import { IAuto, } from '@/types/component'
import styled from 'styled-components'
import Acon, { Icon } from '@/components/Acon'

const MenuItem = styled.div`
  color: #333;
  cursor: pointer;
  padding: 10px;
  &:hover {
    background-color: ${props => props.className === 'edit' ? 'transparent' : '#71ace3'};
  }
`
export default function CMenuItem({ self, mode, children, }: IAuto) {
  return <div>
    <MenuItem className={mode}><Acon icon={self.icon as Icon} style={{ marginRight: 5 }} />{self.title}</MenuItem>
    <div style={{ paddingLeft: 24 }}>
      {children}
    </div>
  </div>
}