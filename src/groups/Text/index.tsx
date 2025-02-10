import { IComponent } from '@/types/component'

export default function SearchBtn({ self, mode, source }: { self: IComponent, mode: string, children?: any, level: number, source: any }) {
  return <div>
    {mode === 'edit' ? 'mock' : source[(self.widget?.field as string)]}
  </div>
}