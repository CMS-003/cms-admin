import { Fragment, useCallback, useEffect, useRef, forwardRef } from 'react';
import { Button, Space, Select, Image, Divider, Switch, Spin, message } from 'antd';
import { Observer, useLocalObservable } from 'mobx-react';
import { IComponent, ITemplate } from '@/types'
import apis from '@/api'
import { useEffectOnce } from 'react-use';
import store from '@/store';
import { AlignAside, FullWidth, FullWidthAuto, FullHeight, FullHeightFix, FullHeightAuto } from '@/components/style'
import { Wrap, Card } from './style';
import AutoPage from '../../groups/auto'
import events from '@/utils/event';
import Acon from '@/components/Acon';

const ComponentTemplatePage = () => {
  const ref = useRef(null)
  const local = useLocalObservable<{
    mode: string,
    loading: boolean,
    fetching: boolean,
    temp: IComponent | null,
    edit_template_id: string,
    templates: ITemplate[],
    types: { name: string, value: string }[],
    selectedProjectId: string,
    setLoading: Function,
    setEditTemplateID: Function,
    setTemplates: Function;
  }>(() => ({
    mode: 'edit',
    loading: true,
    fetching: false,
    templates: [],
    temp: null,
    selectedProjectId: '',
    edit_template_id: '',
    types: [],
    setLoading(is: boolean) {
      this.loading = is;
    },
    setEditTemplateID(id: string) {
      this.edit_template_id = id;
    },
    setTemplates(templates: ITemplate[]) {
      this.templates = templates
    }
  }))
  const refresh = useCallback(async () => {
    local.setLoading(true);
    try {
      const result = await apis.getTemplates({ query: { project_id: store.app.project_id } })
      if (result.code === 0) {
        local.setTemplates(result.data.items);
        store.component.setEditComponentId('')
        if (local.templates.length) {
          if (!local.edit_template_id) {
            local.setEditTemplateID(local.templates[0]._id)
          }
        }
      }
    } catch (e) {
      console.log(e)
    } finally {
      local.setLoading(false);
    }
  }, [])
  useEffectOnce(() => {
    refresh()
    events.on('finished', () => {
      local.fetching = false;
    })
  })
  return (<Observer>{() => <Fragment>
    <FullWidth style={{ flex: 1, overflowY: 'auto' }}>
      <FullWidthAuto className='hidden-scrollbar' style={{ display: 'flex', flex: '140px 0 0', height: '100%', overflow: 'auto' }}>
        <Wrap>
          {[{ value: 'container', label: '容器' }, { value: 'widget', label: '控件' }, { value: 'component', label: '组件' }].map(t => (<div key={t.value} style={{ marginTop: 10, marginLeft: 5, position: 'relative', overflow: 'hidden', border: '1px solid #ccc' }}>
            <div>{t.label}</div>
            {store.component.types.filter(it => it.group === t.value).map(item => (<Card
              draggable
              key={item._id}
              title={item.title}
              onDragStartCapture={() => {
                store.component.setDragType(item.name);
              }}
              onDragEndCapture={() => {
                store.component.setDragType('')
              }}>
              <Image style={{ width: 24, height: 24 }} draggable={false} src={store.app.imageLine + item.cover} preview={false}
              />
              <div className='txt-omit'>{item.title}</div>
            </Card>))}
          </div>))}
        </Wrap>
      </FullWidthAuto>
      <FullWidthAuto style={{ height: '100%', overflow: 'auto' }}>
        <FullHeight style={{ alignItems: 'center' }}>
          <FullHeightFix>
            <AlignAside style={{ padding: 10, width: '100%', justifyContent: 'center' }}>
              <Space>
                <Select value={local.edit_template_id} style={{ width: 200 }} onChange={v => {
                  local.setEditTemplateID(v)
                  refresh()
                }}>
                  {local.templates.map(it => <Select.Option key={it._id} value={it._id}>{it.title}</Select.Option>)}
                </Select>
              </Space>
              <Divider type="vertical" />
              <Space>
                < Button type="primary" onClick={e => {
                  refresh()
                }}>刷新</Button>
              </Space>
              <Divider type="vertical" />
              <Switch checked={local.mode === 'edit'} onChange={v => { local.mode = v ? 'edit' : 'preview' }} />{local.mode === 'edit' ? '编辑' : '预览'}
              <Divider type="vertical" />
              < Button type="primary" onClick={async (e) => {
                try {
                  // 请求剪贴板读取权限
                  const clipboardItems = await navigator.clipboard.read();
                  // 遍历剪贴板项
                  for (const clipboardItem of clipboardItems) {
                    // 获取文本内容
                    for (const type of clipboardItem.types) {
                      if (type === 'text/plain') {
                        const blob = await clipboardItem.getType(type);
                        const text = await blob.text();
                        events.emit('paste_component', text)
                      }
                    }
                  }
                } catch (err) {
                  console.error('无法读取剪贴板:', err);
                  message.error('无法访问剪贴板，请确保已授予权限');
                }
              }}>粘贴</Button>
            </AlignAside>
          </FullHeightFix>
          <FullWidthAuto className='hidden-scrollbar' style={{ display: 'flex', justifyContent: 'center', position: 'relative', padding: 10, width: '100%', height: '100%', overflow: 'hidden' }}>
            {local.loading
              ? <Spin style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center', height: 300, }} indicator={<Acon icon='LoadingOutlined' />} tip="加载中..." />
              : <AutoPage template_id={local.edit_template_id} mode={local.mode} path="" close={() => { }} />
            }
          </FullWidthAuto>
          <FullHeightFix style={{ justifyContent: 'center', paddingBottom: 10 }}>
            <Button type="primary" onClick={async () => {
              local.fetching = true
              events.emit('editable', local.edit_template_id)
            }}>保存</Button>
          </FullHeightFix>
        </FullHeight>
      </FullWidthAuto>
    </FullWidth>
  </Fragment >}</Observer >);
};

export default ComponentTemplatePage;