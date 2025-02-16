import { IAuto } from '@/types/component'
import { Select } from 'antd'
import { Observer, useLocalStore } from 'mobx-react'
import events from '@/utils/event';

export default function CSelect({ self }: IAuto) {
  const local = useLocalStore(() => ({
    open: false,
  }))
  return <Observer>{() => (
    <div>
      {self.title}
      <Select
        style={{ marginLeft: 5 }}
        open={local.open}
        defaultValue={self.widget.value}
        onChange={v => {
          events.emit('setQuery', { page: self.template_id, field: self.widget.field, value: v, force: true, template_id: self.template_id })
        }}
        onMouseDown={(e) => {
          if (e.button === 0) {
            setTimeout(() => {
              local.open = !local.open
            }, 200)
          }
        }}
      >
        {self.widget.refer.map(t => (
          <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
        ))}
      </Select>
    </div>
  )}</Observer>
}