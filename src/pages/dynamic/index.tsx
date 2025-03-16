import { Observer } from 'mobx-react'
import AutoPage from '../../groups/auto'
import { useMemo } from 'react'

export default function Page({ id, path, close }: { id: string, path: string, close: Function }) {
  const cache = useMemo(() => (
    <Observer>{() => (
      <AutoPage template_id={id} mode="preview" path={path} close={close} />
    )}</Observer>
  ), [path])
  return cache
}