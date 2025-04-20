import CONST from '@/constant'
import { IAuto, IBaseComponent } from '@/types/component'
import hbs from 'handlebars'
import { Observer, useLocalObservable } from 'mobx-react'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import store from '@/store'

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
    return moment(o).format(format);
  }
  return o;
});

export default function CTpl({ self, mode, source, setSource, drag, dnd, children }: IAuto & IBaseComponent) {
  const local = useLocalObservable(() => ({
    tpl: hbs.compile(self.widget.value as string, {})
  }))
  const navigate = useNavigate();
  return <Observer>{() => (
    <div
      className={mode + drag.className}
      onClick={() => {
        if (self.widget.action === CONST.ACTION_TYPE.GOTO_PAGE) {
          navigate(`${self.widget.action_url}?id=${source._id}`)
        }
      }}
      {...drag.events}
      ref={dnd?.ref}
      {...dnd?.props}
      style={{
        whiteSpace: 'nowrap',
        ...self.style,
        ...dnd?.style,
        backgroundColor: dnd?.isDragging ? 'lightblue' : '',
      }}
    >
      {children}
      {mode === 'edit' ? self.title : <div style={{ whiteSpace: 'normal' }} dangerouslySetInnerHTML={{ __html: local.tpl({ ...(source || {}), store }) }}></div>}
    </div>
  )
  }</Observer >
}