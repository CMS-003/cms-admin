import { Fragment, useCallback, useEffect } from 'react';
import { Button, Space, Select, Image, Divider, Switch, Spin } from 'antd';
import { Observer, useLocalStore } from 'mobx-react';
import { IComponent, ITemplate } from '@/types'
import apis from '@/api'
import { useEffectOnce } from 'react-use';
import store from '@/store';
import { AlignAside, FullWidth, FullWidthAuto, FullHeight, FullHeightFix } from '@/components/style'
import { Wrap, Card } from './style';
import Auto from '../../groups/auto'
import events from '@/utils/event';
import Acon from '@/components/Acon';

const ComponentTemplatePage = ({ t }: { t?: number }) => {
  const local = useLocalStore<{
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
    }
  }))
  const refresh = useCallback(async () => {
    local.setLoading(true);
    try {
      const result = await apis.getTemplates({ query: { project_id: store.app.project_id } })
      if (result.code === 0) {
        local.templates = result.data.items
        store.app.setEditComponentId('')
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
  useEffect(() => {
    store.component.types.map(item => ({ name: item.title, value: item.name }))
  }, [t])
  useEffectOnce(() => {
    refresh()
    events.on('finished', () => {
      local.fetching = false;
    })
  })
  return (<Observer>{() => <Fragment>
    <FullWidth style={{ flex: 1, overflowY: 'auto' }}>
      <FullWidthAuto style={{ flex: '120px 0 0' }}>
        <Wrap>
          {store.component.types.map(item => (<Card draggable key={item._id}
            onDragStartCapture={() => {
              store.app.setDragType(item.name);
            }}
            onDragEndCapture={() => {
              store.app.setDragType('')
            }}>
            <Image style={{ width: 24, height: 24 }} draggable={false} src={store.app.imageLine + item.cover} preview={false}
            />
            <div>{item.title}</div>
          </Card>))}
        </Wrap>
      </FullWidthAuto>
      <FullWidthAuto style={{ height: '100%' }}>
        <FullHeight>
          <FullHeightFix>
            <AlignAside style={{ padding: 10, width: '100%', justifyContent: 'center' }}>
              <Space>
                <Select value={local.edit_template_id} onChange={v => {
                  local.edit_template_id = v;
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
            </AlignAside>
          </FullHeightFix>
          <FullWidthAuto style={{ display: 'flex', justifyContent: 'center', position: 'relative', overflow: 'auto' }}>
            {local.loading ? <Spin style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center', height: 300, }} indicator={<Acon icon='LoadingOutlined' />} tip="加载中..." /> : <Auto template_id={local.edit_template_id} mode={local.mode} />}
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