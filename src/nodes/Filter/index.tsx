import { FullHeight, FullHeightAuto } from "@/components/style";
import { IBaseCom } from "@/types";
import { Grip } from "lucide-react";
import { Empty } from 'antd';
import { useMode } from "@/context";

export default function CFilter({ self, bindings, children }: IBaseCom) {
  const mode = useMode();
  const cls = ['node', bindings.isDragging ? 'is-dragging' : '',].join(' ');
  return <div
    {...bindings.root}
    className={cls}
    style={{
      flexDirection: 'row', height: '100%', overflow: 'hidden',
    }}>
    <div style={{ display: 'flex' }}>
      {mode === 'edit' && <Grip className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    </div>
    <FullHeight style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '5px 0', ...self.style }}>
        {children}
      </div>
      <FullHeightAuto>
        <Empty style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }} />
      </FullHeightAuto>
    </FullHeight>
  </div>
}
