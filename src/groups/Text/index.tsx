import { IAuto } from '@/types/component'

export default function CText({ self, mode, source = {} }: IAuto) {
  return <div style={{ lineHeight: 2.5 }}>
    {mode === 'edit' ? self.title : (source[self.widget.field] || self.title)}
  </div>
}