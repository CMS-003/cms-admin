import { Observer } from 'mobx-react'
import Auto from '../../groups/auto'
import { IPageInfo } from '@/types'

export default function Page({ setTitle, id, page }: { setTitle: (title: string) => void, id: string, page?: IPageInfo }) {
  return <Observer>{() => (
    <Auto template_id={id} mode="preview" setTitle={setTitle} page={page} />
  )}</Observer>
}