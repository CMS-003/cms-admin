import Acon from '@/components/Acon'
import { IComponent } from '@/types/component'

export default function SearchBtn({ self, mode, children, level }: { self: IComponent, mode: string, children?: any, level: number }) {
  return <div>
    <Acon icon='SearchOutlined' />
  </div>
}