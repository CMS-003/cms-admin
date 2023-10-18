import { IComponent } from '@/types/component'
import { SearchOutlined } from '@ant-design/icons'

export default function SearchBtn({ self, mode, children, level }: { self: IComponent, mode: string, children?: any, level: number }) {
  return <div>
    <SearchOutlined />
  </div>
}