import { DatePicker } from 'antd'
import { Observer } from 'mobx-react'
import { ITableWidget } from '@/types';
import moment from 'moment'

const dateFormat = 'YYYY-MM-DD';

export default function Widget(props: { widget: ITableWidget, mode: string }) {
  return <Observer>{() => (
    <DatePicker value={moment(props.widget.value || new Date(), dateFormat)} format={dateFormat} onChange={(mo, str) => {
      props.widget.value = str
    }} />
  )}</Observer>
}