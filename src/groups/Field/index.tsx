import { IComponent } from '@/types/component'

export default function Field({ self, mode, source }: { self: IComponent, mode: string, children?: any, level: number, source: any }) {
  return <div>
    {self.title}
  </div>
}