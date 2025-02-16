import { IAuto } from '@/types/component'

export default function CMenu({ self, mode, children }: IAuto) {
  return <div style={self.style}>
    {children}
  </div>
}