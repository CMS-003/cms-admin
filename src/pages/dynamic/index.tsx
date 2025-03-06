import { Observer } from 'mobx-react'
import AutoPage from '../../groups/auto'
import { useMemo } from 'react'

export default function Page({ id, path }: { id: string, path: string }) {
  const cache = useMemo(() => (
    <Observer>{() => (
      <AutoPage template_id={id} mode="preview" path={path} />
    )}</Observer>
  ), [path])
  return cache
}