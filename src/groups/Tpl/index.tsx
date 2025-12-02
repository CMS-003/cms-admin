import CONST from '@/constant'
import { IAuto, IBaseComponent } from '@/types/component'
import hbs from 'handlebars'
import { Observer, useLocalObservable } from 'mobx-react'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import store from '@/store'
import { ComponentWrap } from '../style';

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
    return moment(o).utcOffset(8).format(format);
  }
  return o;
});


export default function CTpl({ self, mode, source, drag, children }: IAuto & IBaseComponent) {
  const local = useLocalObservable(() => ({
    tpl: hbs.compile(self.widget.value as string, {})
  }))
  const navigate = useNavigate();
  return <Observer>{() => (
    <ComponentWrap
      className={mode + drag.className}
      onClick={() => {
        if (self.widget.action === CONST.ACTION_TYPE.GOTO_PAGE) {
          navigate(`${self.url}?id=${source._id}`)
        }
      }}
      {...drag.events}
    >
      {children}
      <div style={{ lineHeight: '32px' }}>
        {mode === 'edit' ? self.title : <div dangerouslySetInnerHTML={{ __html: local.tpl({ ...(source || {}), store }) }}></div>}
      </div>
    </ComponentWrap>
  )
  }</Observer >
}