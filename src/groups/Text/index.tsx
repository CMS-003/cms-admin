import { IComponent } from '@/types/component'

export default function Text({ self, mode, source = {} }: { self: IComponent, mode: string, children?: any, level: number, source: any }) {
  return <div style={{ lineHeight: 2.5 }}>
    {mode === 'edit' ? self.title : (source[(self.widget?.field as string)] || self.title)}
  </div>
}