import store from "@/store";
import { IBaseCom } from "@/types";
import { useLocalProxy } from "@/utils/valtio";
import { GripVertical } from "lucide-react";
import hbs from 'handlebars'
import dayjs from 'dayjs';
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

// 初始化插件（只初始化一次）
let initialized = false;

function init() {
  if (!initialized) {
    dayjs.extend(utc);
    dayjs.extend(timezone);
    initialized = true;
  }
}
init();

// @ts-ignore
hbs.registerHelper('compare', function (lvalue, operator, rvalue, options) {
  const operators = {
    '==': (l: any, r: any) => l == r,
    '===': (l: any, r: any) => l === r,
    '!=': (l: any, r: any) => l != r,
    '!==': (l: any, r: any) => l !== r,
    '<': (l: any, r: any) => l < r,
    '>': (l: any, r: any) => l > r,
    '<=': (l: any, r: any) => l <= r,
    '>=': (l: any, r: any) => l >= r,
    '||': (l: any, r: any) => l || r,
    '&&': (l: any, r: any) => l && r
  };

  // @ts-ignore
  if (!operators[operator]) {
    throw new Error(`未知的操作符: ${operator}`);
  }

  // @ts-ignore
  const result = operators[operator](lvalue, rvalue);

  if (result) {
    // @ts-ignore
    return options.fn(this);
  }
  // @ts-ignore
  return options.inverse(this);
});
hbs.registerHelper('formatDate', function (o, format) {
  if (typeof o === 'string') {
    return dayjs(o).utcOffset(8).format(format);
  }
  return o;
});

export default function CTpl({ self, actions, bindings, source, mode, children }: IBaseCom) {
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
    {mode === 'edit' && <GripVertical className="node-handle" ref={bindings.handleRef} onContextMenu={bindings.onContextMenu} />}
    {mode === 'edit' ? self.title : <div style={{ width: '100%' }} dangerouslySetInnerHTML={{ __html: localState.tpl({ ...(source || {}), store }) }}></div>}
  </div>
}