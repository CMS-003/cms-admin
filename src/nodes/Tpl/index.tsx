import store from "@/store";
import { IBaseCom } from "@/types";
import { useLocalProxy } from "@/utils/valtio";
import { GripVertical } from "lucide-react";
import hbs from 'handlebars'

export default function CTpl({ self, bindings, source, mode, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  const [localState, localStore] = useLocalProxy({
    tpl: hbs.compile(self.widget.value as string, {})
  })
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    {mode === 'edit' && <GripVertical className="node-handle" {...bindings.handle.listeners} {...bindings.handle.attributes} />}
    {mode === 'edit' ? self.title : <div dangerouslySetInnerHTML={{ __html: localState.tpl({ ...(source || {}), store }) }}></div>}
  </div>
}