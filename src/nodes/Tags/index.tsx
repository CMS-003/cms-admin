import { IBaseCom } from "@/types";
import { GripVertical } from "lucide-react";
import { Acon, VisualBox } from '@/components'
import { useLocalProxy } from "@/utils/valtio";
import { FullHeight, FullWidth } from "@/components/style";
import { Input, Tag } from "antd";
import { isNil } from "lodash-es";
import { useEffectOnce } from "react-use";
import { Fragment } from "react/jsx-runtime";

export default function CTags({ self, bindings, source, setDataField, mode, children }: IBaseCom) {
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  const [localState, localStore] = useLocalProxy({
    addVisible: false,
    tempTag: '',
  });
  useEffectOnce(() => {
    if (isNil(source[self.widget.field])) {
      setDataField(self.widget, self.widget.value)
    }
  })
  const field = self.widget.field;

  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row',
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <GripVertical className="node-handle" {...bindings.handle.listeners} {...bindings.handle.attributes} />}
    </div>
    <FullHeight>
      <FullWidth>
        {((source[field] || []) as string[]).map((tag, i) => (
          <Tag style={{ margin: '6px 5px 6px 0' }} key={tag} closable onClose={() => {
            const rest = source[field].filter((v: string) => v !== tag)
            setDataField(self.widget, rest)
          }}>{tag}</Tag>
        ))}
      </FullWidth>
      <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
        {localState.addVisible ? (
          <Input value={localState.tempTag} style={{ minWidth: 100 }} onChange={e => {
            localStore.tempTag = e.target.value
          }} suffix={<Fragment>
            <Acon icon='CircleCheck' onClick={() => {
              if (localStore.tempTag && !source[field].includes(localStore.tempTag)) {
                const tags = [...source[field], localStore.tempTag]
                setDataField(self.widget, tags)
              }
              localStore.tempTag = ''
              localStore.addVisible = false
            }} />
            <Acon icon='CircleX' onClick={() => { localStore.tempTag = ''; localStore.addVisible = false }} />
          </Fragment>} />
        ) : <span style={{ border: '1px dotted #8b8a8a', borderRadius: 4, lineHeight: 1, padding: '3px 5px' }}>
          <Acon icon='Plus' onClick={() => localStore.addVisible = true} />
        </span>}
      </div>
    </FullHeight>
  </div>
}