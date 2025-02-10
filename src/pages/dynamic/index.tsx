import { Observer } from 'mobx-react'
import Auto from '../../groups/auto'

export default function Page({ setTitle, id }: { setTitle: (title: string) => void, id: string }) {
  return <Observer>{() => (
    <Auto template_id={id} mode="preview" setTitle={setTitle}/>
  )}</Observer>
}