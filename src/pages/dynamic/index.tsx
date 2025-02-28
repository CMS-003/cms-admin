import { Observer } from 'mobx-react'
import Auto from '../../groups/auto'
import { IPageInfo } from '@/types'

export default function Page({ id, page }: { id: string, page: IPageInfo }) {
  return <Observer>{() => (
    <Auto template_id={id} mode="preview" page={page} />
  )}</Observer>
}