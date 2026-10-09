import { Observer } from 'mobx-react'
import AutoPage from '../../groups/auto'
import { useMemo } from 'react'
import { TView } from '@/composer/TemplateView'

export default function Page({ id, path, close }: { id: string, path: string, close: Function }) {
  const cache = useMemo(() => (
    <Observer>{() => (
      <TView template_id={id} mode="preview" path={path} close={close} />
      // <AutoPage template_id={id} mode="preview" path={path} close={close} />
    )}</Observer>
  ), [path])
  return cache
}