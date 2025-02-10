import { IComponent } from '@/types/component'

export default function ComponentMenu({ self, mode, children }: { self: IComponent, mode: string, children?: any }) {
  return <div style={Object.fromEntries(self.style)}>
    {children}
  </div>
}