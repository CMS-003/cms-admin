import { FullHeight, FullHeightAuto, FullWidth, FullWidthFix } from '@/components/style';
import { Observer, useLocalObservable } from 'mobx-react';
import { useCallback, useEffect, useRef } from 'react';
import { Table } from 'antd';
import { toJS } from 'mobx';
import { useEffectOnce } from 'react-use';
import apis from '@/api';
import { ITableView, ITableWidget } from '@/types';
import hbs from 'handlebars'
import { Transform } from '@/groups/widgets';
import events from '@/utils/event';
import moment from 'moment';


hbs.registerHelper('eq', function (a, b, options) {
  // @ts-ignore
  const that = this as any;
  if (a == b) {
    return options.fn(that);
  }
  return options.inverse(that);
});
hbs.registerHelper('moment', function (time, format) {
  return moment(time).format(format);
});

export default function ({ setTitle }: { setTitle: (title: string) => void, }) {
  const local = useLocalObservable<{
    view: ITableView | null,
    view_id: string,
    table: string,
    url: string,
    page: number,
    page_size: number,
    total: number,
    loading: boolean,
    getQuery: () => { [key: string]: string | number },
    clear: () => void,
    destroy: (table: string, id: string) => void,
    widgets: ITableWidget[],
    columns: { title: string, key: string, render?: (value: any, record: any, index: number) => JSX.Element }[],
    list: any[],
  }>(() => ({
    view: null,
    columns: [],
    list: [],
    widgets: [],
    view_id: '',
    table: '',
    url: '',
    loading: false,
    page: 1,
    page_size: 15,
    total: 0,
    getQuery() {
      const query: any = {
        page: local.page,
        page_size: local.page_size,
      };
      local.widgets.forEach(widget => {
        if (widget.widget !== 'column' && widget.field) {
          query[widget.field] = widget.value;
        }
      })
      return query;
    },
    clear() {
      local.widgets.forEach(widget => {
        if (widget.widget !== 'column') {
          widget.value = '';
        }
      })
    },
    async destroy(table, id) {
      local.loading = true;
      try {
        await apis.destroyData(table, id);
      } catch (e) {

      } finally {
        local.loading = false;
      }
    }
  }));
  const getList = useCallback(async () => {
    if (local.url) {
      try {
        local.loading = true;
        const query = local.getQuery();
        const resp = await apis.getList(local.url, query);
        if (resp.code === 0) {
          local.list = resp.data.items;
          local.total = resp.data.total as number;
        }
      } finally {
        local.loading = false;
      }
    }
  }, []);
  const clickRef: { current: HTMLDivElement | null } = useRef(null);
  useEffect(() => {
    if (clickRef.current) {
      clickRef.current.addEventListener('click', function (event) {
        const target = event.target as HTMLElement;
        if (target.tagName.toLowerCase() === 'span' && target.classList.contains('delete')) {
          event.preventDefault();
          event.stopPropagation();
          const o = document.createElement('div');
          o.style.position = 'absolute';
          o.style.width = '150px';
          o.style.left = (target.offsetLeft + target.offsetWidth / 2 - 75) + 'px';
          o.style.bottom = target.offsetHeight + 6 + 'px';
          o.style.backgroundColor = 'white';
          o.style.borderRadius = '5px';
          o.style.zIndex = '2';
          o.style.boxShadow = '0px 0px 3px #ccc';
          const mask = document.createElement('div');
          mask.style.position = 'fixed';
          mask.style.left = '0';
          mask.style.top = '0';
          mask.style.width = '100%';
          mask.style.height = '100%';
          mask.style.backgroundColor = 'rgba(0,0,0,0.3)';
          mask.style.zIndex = '1';
          document.body.appendChild(mask);

          const oContent = document.createElement('div');
          oContent.style.margin = '10px 15px';
          oContent.innerText = '确定要执行吗?';
          const oOperation = document.createElement('div');
          oOperation.style.textAlign = 'right';
          oOperation.style.margin = '10px';
          oOperation.style.fontSize = '12px';
          const oCancel = document.createElement('span');
          oCancel.style.border = '1px solid #ccc';
          oCancel.style.borderRadius = '3px';
          oCancel.style.padding = '4px 6px';
          oCancel.style.cursor = 'pointer';
          oCancel.innerText = '取消';
          const oConfirm = document.createElement('span');
          oConfirm.style.backgroundColor = '#1890ff';
          oConfirm.style.color = 'white';
          oConfirm.style.marginRight = '10px';
          oConfirm.style.padding = '5px 7px';
          oConfirm.style.borderRadius = '3px';
          oConfirm.style.cursor = 'pointer';
          oConfirm.innerText = '确定';
          oConfirm.addEventListener('click', function () {
            target.parentNode?.removeChild(o);
            document.body.removeChild(mask);
            local.destroy(local.table, target.getAttribute('data-id') || '');
          });
          oCancel.addEventListener('click', function () {
            target.parentNode?.removeChild(o);
            document.body.removeChild(mask);
          });
          mask.addEventListener('click', function () {
            target.parentNode?.removeChild(o);
            document.body.removeChild(mask);
          });
          oOperation.appendChild(oConfirm)
          oOperation.appendChild(oCancel)
          o.appendChild(oContent);
          o.appendChild(oOperation);
          target.parentNode?.append(o);
        }
      });
    };
  }, [clickRef.current])
  const init = useCallback(async () => {
    const resp = await apis.getViewDetail(local.view_id, {})
    if (resp.code === 0) {
      local.view = resp.data;
      local.table = resp.data.table;
      local.url = resp.data.url;
      setTitle(resp.data.name);
      local.widgets = resp.data.widgets.filter(it => it.widget !== 'column');
      local.columns = resp.data.widgets.filter(it => it.widget === 'column').map((it, i) => {
        const tpl = hbs.compile(it.template);
        return {
          title: it.label,
          key: i + '',
          dataIndex: it.field,
          render: (value: any, record: any, index: number) => {
            let html = '';
            try {
              html = tpl({ data: record, widget: it })
            } catch (e) {
              console.log(e);
            }
            return <div style={{ position: 'relative' }} dangerouslySetInnerHTML={{ __html: html }}></div>
          }
        }
      });
      await getList();
    }
  }, []);
  useEffectOnce(() => {
    const params = new URL(window.location.href).searchParams;
    local.view_id = params.get('view_id') || '';
    init();
    function search(data: any) {
      if (data.view_id === local.view_id) {
        getList();
      }
    }
    function clear(data: any) {
      if (data.view_id === local.view_id) {
        local.clear();
      }
    }
    events.on('search', search);
    events.on('clear', clear);
    return () => {
      events && events.off('search', search);
      events && events.off('clear', clear);
    }
  })
  return <Observer>
    {() => (
      <FullHeight style={{ padding: 10 }}>
        <FullWidth style={{ marginBottom: 10 }}>
          {local.widgets.map((it, i) => <Transform key={i} widget={it} mode="preview" onChange={(field: string, v: any) => {
            console.log(field, v);
          }} onFetch={getList} />)}
        </FullWidth>
        <FullHeightAuto ref={node => clickRef.current = node}>
          <Table
            rowKey={'_id'}
            columns={local.columns}
            dataSource={toJS(local.list)}
            pagination={{ total: local.total, pageSize: local.page_size, position: ['bottomRight'] }}
            onChange={(p) => {
              local.page = p.current as number;
              getList();
            }}
          >

          </Table>
        </FullHeightAuto>
      </FullHeight>
    )}
  </Observer>
}