import React, {
  FC,
  useEffect,
  useCallback,
  Fragment,
} from 'react'
import { useEffectOnce } from 'react-use';
import { useLocation, useNavigate } from 'react-router-dom'
import { Tabs, Alert, Dropdown, Menu, Spin } from 'antd'

import { Observer, useLocalStore } from 'mobx-react'
import { ISimpleType, IMSTArray } from 'mobx-state-tree'
import store from '@/store'

import HomePage from '@/pages/dashboard'
import ErrorPage from '@/pages/error'
import { CenterXY } from '@/components/style';
import OAuthSuccessPage from '@/pages/oauthResult/success';
import OAuthFailPage from '@/pages/oauthResult/fail';
import Loadable from 'react-loadable';
import Acon from '@/components/Acon';

// path=pathname+search=xxxkey=fullpath
// 除了 Page 路由中 path 不能体现 search 参数 IPage 和 IPanel 要分开
type IPanel = {
  // 标签页名称
  title?: string;
  // 标签页对应的 url 路径
  path: string,
  // 动态页id
  id: string,
  // 标签页是否可以被关闭
  closable?: boolean;
  Content?: any;
}
type IPage = {
  title?: string;
  route: string;
  Content?: any;
  closable?: boolean;
  // querystring中要保持唯一
  uniques?: string[];
}

function getKeyName(key: string): IPanel {
  const [_pathname, _search] = key.split('?');
  const [, id = ''] = /^\/manager\/dynamic\/([^\/]+)[/]?$/.exec(_pathname) || [];
  const Page = id ? Pages['/manager/dynamic/:id'] : Pages[_pathname];
  return Page ? {
    title: Page.title,
    Content: Page.Content,
    path: key,
    id,
    closable: Page.closable,
  } : {
    title: '404',
    Content: function () {
      return <ErrorPage status="404" subTitle="?" errTitle="Not Found" />
    },
    closable: true,
    id,
    path: key
  }
}

function LoadingPage() {
  return <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
    <Spin spinning />
  </div>
}

const LoadableConfigPage = Loadable({
  loader: () => import('@/pages/config'),
  loading: LoadingPage,
});
const LoadableProjectPage = Loadable({
  loader: () => import('@/pages/project'),
  loading: LoadingPage,
});
const LoadableUserBind = Loadable({
  loader: () => import('@/pages/user/bind'),
  loading: LoadingPage,
});
const LoadableEditable = Loadable({
  loader: () => import('@/pages/template/editable'),
  loading: LoadingPage,
});
const LoadableTemplateForm = Loadable({
  loader: () => import('@/pages/template/form'),
  loading: LoadingPage,
});

const LoadableTemplatePage = Loadable({
  loader: () => import('@/pages/template'),
  loading: LoadingPage,
});

const LoadableDynamicPage = Loadable({
  loader: () => import('@/pages/dynamic'),
  loading: LoadingPage,
});

const LoadableComponentPage = Loadable({
  loader: () => import('@/pages/component'),
  loading: LoadingPage,
});

const LoadableComponentTypePage = Loadable({
  loader: () => import('@/pages/component/type'),
  loading: LoadingPage,
});
const LoadableLogSystem = Loadable({
  loader: () => import('@/pages/log/system'),
  loading: LoadingPage,
});
const LoadableVerification = Loadable({
  loader: () => import('@/pages/log/verification'),
  loading: LoadingPage,
});
const LoadableWidgetPage = Loadable({
  loader: () => import("@/pages/component/widget"),
  loading: LoadingPage,
});
const LoadableTablesPage = Loadable({
  loader: () => import("@/pages/table/index"),
  loading: LoadingPage,
});
const LoadableTableDetailPage = Loadable({
  loader: () => import("@/pages/table/detail"),
  loading: LoadingPage,
});
const LoadableTableFormModifyPage = Loadable({
  loader: () => import("@/pages/table/form/modify"),
  loading: LoadingPage,
});
const FormPreviewPage = Loadable({
  loader: () => import("@/pages/table/form/preview"),
  loading: LoadingPage,
});
const ListModifyPage = Loadable({
  loader: () => import('@/pages/table/list/modify'),
  loading: LoadingPage,
});
const ListPreviewPage = Loadable({
  loader: () => import('@/pages/table/list/preview'),
  loading: LoadingPage,
})

const pageArr: IPage[] = [
  { title: '首页', Content: HomePage, closable: false, route: process.env.PUBLIC_URL + '/dashboard' },
  { title: '授权成功', Content: OAuthSuccessPage, closable: true, route: process.env.PUBLIC_URL + '/oauth/success' },
  { title: '授权失败', Content: OAuthFailPage, closable: true, route: process.env.PUBLIC_URL + '/oauth/fail' },
  { title: '配置管理', Content: (props: any) => <LoadableConfigPage  {...props} />, closable: true, route: process.env.PUBLIC_URL + '/config' },
  { title: '所有表', Content: (props: any) => <LoadableTablesPage {...props} />, closable: true, route: process.env.PUBLIC_URL + '/tables/all' },
  { title: '表定义', Content: (props: any) => <LoadableTableDetailPage {...props} />, closable: true, route: process.env.PUBLIC_URL + '/tables/detail' },
  { title: '表单编辑', Content: (props: any) => <LoadableTableFormModifyPage {...props} />, closable: true, route: process.env.PUBLIC_URL + '/tables/form/modify' },
  { title: '表单预览', Content: (props: any) => <FormPreviewPage  {...props} />, closable: true, route: process.env.PUBLIC_URL + '/tables/form/preview' },
  { title: '列表编辑', Content: (props: any) => <ListModifyPage {...props} />, closable: true, route: process.env.PUBLIC_URL + '/tables/list/modify' },
  { title: '列表预览', Content: (props: any) => <ListPreviewPage  {...props} />, closable: true, route: process.env.PUBLIC_URL + '/tables/list/preview' },
  { title: '项目管理', Content: (props: any) => <LoadableProjectPage {...props} />, closable: true, route: process.env.PUBLIC_URL + '/project' },
  { title: '组件管理', Content: (props: any) => <LoadableProjectPage {...props} />, closable: true, route: process.env.PUBLIC_URL + '/component/data' },
  { title: '控件类型', Content: (props: any) => <LoadableWidgetPage {...props} />, closable: true, route: process.env.PUBLIC_URL + '/component/widget' },
  { title: '组件类型', Content: (props: any) => <LoadableComponentTypePage {...props} />, closable: true, route: process.env.PUBLIC_URL + '/component/type' },
  { title: '表单页', Content: (props: any) => <LoadableTemplateForm {...props} />, closable: true, route: process.env.PUBLIC_URL + '/template/form' },
  { title: '模板页', Content: (props: any) => <LoadableTemplatePage {...props} />, closable: true, route: process.env.PUBLIC_URL + '/template/page' },
  { title: '动态页', Content: (props: any) => <LoadableDynamicPage {...props} />, closable: true, route: process.env.PUBLIC_URL + '/dynamic/:id' },
  { title: '可视化编辑', Content: (props: any) => <LoadableEditable {...props} />, closable: true, route: process.env.PUBLIC_URL + '/template/editable' },
  { title: '系统日志', Content: (props: any) => <LoadableLogSystem {...props} />, closable: true, route: process.env.PUBLIC_URL + '/log/system' },
  { title: '验证码', Content: (props: any) => <LoadableVerification {...props} />, closable: true, route: process.env.PUBLIC_URL + '/log/verification-code' },
  { title: '', Content: function (props: any) { return <ErrorPage status="404" subTitle="?" errTitle="Not Found" {...props} /> }, closable: true, route: process.env.PUBLIC_URL + '/result/404' },
  { title: '第三方账号绑定', Content: (props: any) => <LoadableUserBind {...props} />, closable: true, route: process.env.PUBLIC_URL + '/user/bind' },
];

const Pages: { [key: string]: IPage } = {};
pageArr.forEach(p => {
  Pages[p.route] = p;
});

// 多页签组件
const TabPanes: FC = () => {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const fullPath = pathname + search
  const local = useLocalStore<{
    currentTag: string;
    pushPanel(pane: IPanel): void;
    setCurrentTag(arg0: string): void;
    saveTags(panels: IPanel[]): void;
    isReload: boolean;
    reloadPath: string;
    operateKey: string;
    setPanel(remain_panels: IPanel[]): void;
    setByIndex: Function;
    panels: IPanel[]
  }>(() => ({
    reloadPath: '',
    panels: [],
    currentTag: store.page.currentTag,
    isReload: true,
    operateKey: '',
    saveTags(panels: IPanel[]) {
      local.panels = panels
      // 记录当前打开的tab
      const tags = local.panels.map((item: IPanel) => item.path) as IMSTArray<ISimpleType<string>>;
      store.page.setOpenedTags(tags)
    },
    setPanel(pages: IPanel[]) {
      local.panels = pages
    },
    setByIndex(index: number, key: keyof IPanel, value: IPanel) {
      local.panels[index][key] = value;
    },
    setCurrentTag(key: string) {
      local.currentTag = key;
    },
    pushPanel(page: IPanel) {
      this.panels.push(page);
    }
  }));
  const resetTabs = useCallback((): void => {
    store.page.openedTags.forEach(tag => {
      const [new_pathname, new_search] = tag.split('?');
      if (new_pathname.startsWith('/manager/dynamic')) {
        const pane = getKeyName(tag);
        local.pushPanel(pane);
      } else if (Pages[new_pathname]) {
        if (-1 !== local.panels.findIndex(pane => pane.path === tag)) {
          // 重复render处理
          return
        }
        const pane = getKeyName(tag)
        local.pushPanel(pane)
      }
    })
    // search 参数处理
    if (Pages[pathname] && !store.page.openedTags.includes(fullPath)) {
      const pane = getKeyName(fullPath)
      local.pushPanel(pane)
      store.page.addTag(fullPath)
    }
    local.setCurrentTag(store.page.openedTags.includes(fullPath) ? fullPath : process.env.PUBLIC_URL + '/dashboard')
  }, [local, pathname, search])

  // 初始化页面
  useEffectOnce(() => {
    resetTabs()
  })

  // 移除tab
  const remove = (targetTag: string): void => {
    const delIndex = local.panels.findIndex(
      (item: IPanel) => item.path === targetTag
    )
    local.panels.splice(delIndex, 1)
    if (targetTag !== fullPath) {
      return
    }
    // 删除当前tab，地址往前推
    const nextPath = store.page.openedTags[delIndex - 1] || store.page.openedTags[delIndex - 1] || process.env.PUBLIC_URL + '/dashboard'
    local.saveTags(local.panels)
    // 如果当前tab关闭后，上一个tab无权限，就一起关掉
    // if (!isAuthorized(tabKey) && nextPath !== '/') {
    //   remove(tabKey)
    //   navigate(store.page.openedTags[delIndex - 2])
    // } else {
    //   navigate(nextPath)
    // }
    navigate(nextPath)
  }

  // 刷新当前 tab
  const refreshTab = (): void => {
    local.isReload = true
    setTimeout(() => {
      local.isReload = false
    }, 1000)

    local.reloadPath = fullPath
    setTimeout(() => {
      local.reloadPath = ''
    }, 500)
  }

  // 关闭其他或关闭所有
  const removeAll = async (isCloseAll?: boolean) => {
    const remain_panels = isCloseAll ? [] : local.panels.filter(pane => pane.path === local.operateKey)
    local.setPanel(remain_panels)
  }

  useEffect(() => {
    // 当前的路由和上一次的一样，无效的新tab，return
    if (fullPath === local.currentTag) {
      return
    };
    // 保存到 storage 中
    store.page.setCurrentTag(fullPath)
    // 保存这次的路由地址
    local.setCurrentTag(fullPath)

    const index = local.panels.findIndex(
      (_: IPanel) => _.path === fullPath
    )

    // 新tab已存在，重新覆盖掉（解决带参数地址数据错乱问题）
    if (index > -1) {
      local.setByIndex(index, 'path', fullPath)
      local.setCurrentTag(fullPath)
      return
    }
    // 添加新tab并保存起来
    const Page = getKeyName(fullPath);
    local.pushPanel(Page)
    local.saveTags(local.panels)
    local.setCurrentTag(fullPath)
  }, [local, pathname, resetTabs, search])

  // const isDisabled = () => local.currentTag === '/dashboard'
  // tab右击菜单
  const menu = (
    <Menu
      items={[
        {
          key: 'refresh',
          // icon: <Acon icon="ReloadOutlined" />,
          label: '刷新',
          disabled: false,
        },
        {
          key: 'close',
          // icon: <Acon icon="CloseOutlined" />,
          label: '关闭',
        },
        {
          key: 'closeOther',
          // icon: <Acon icon="CloseOutlined" />,
          label: '关闭其他',
        },
        {
          key: 'closeAll',
          // icon: <Acon icon="CloseOutlined" />,
          label: '关闭所有',
        },
      ]}
      onClick={e => {
        // e.domEvent.stopPropagation()
        if (e.key === 'refresh') {
          refreshTab()
        } else if (e.key === 'close') {
          remove(local.currentTag)
        } else if (e.key === 'closeOther') {
          removeAll(false)
        } else if (e.key === 'closeAll') {
          removeAll(true)
        }
      }}
    />
  );

  return (
    <Observer>{() => (
      <Tabs
        activeKey={local.currentTag}
        style={{ height: '100%', overflow: 'hidden' }}
        className="tag-page"
        tabBarStyle={{ marginBottom: 0 }}
        hideAdd
        onChange={(path: string): void => {
          local.setCurrentTag(path)
        }}
        onEdit={(targetTag: string | any, action: string) => {
          action === 'remove' && remove(targetTag)
          local.saveTags(local.panels)
        }}
        renderTabBar={(props, DefaultTabBar) => (
          <DefaultTabBar {...props} >
            {node => (<Dropdown
              overlay={menu}
              placement="bottomLeft"
              trigger={['contextMenu']}
            >
              <span onContextMenu={(e) => {
                local.operateKey = node.key as string;
                e.preventDefault()
              }}>
                {node}
              </span>
            </Dropdown>)}
          </DefaultTabBar>
        )}
        onTabClick={(targetTag: string) => {
          if (targetTag === local.currentTag) {
            return;
          }
          const { path } = local.panels.filter(
            (item: IPanel) => item.path === targetTag
          )[0]
          navigate(path)
        }}
        type="editable-card"
        size="small"
        items={local.panels.map((Panel, i) => ({
          key: Panel.path,
          label: Panel.title,
          children: local.reloadPath !== Panel.path ? (
            <div key={Panel.path} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}><Panel.Content key={Panel.path} path={Panel.path} id={Panel.id} page={{ path: Panel.path, param: {}, query: Object.fromEntries(new URLSearchParams(Panel.path.split('?')[1])) }} store={store} setTitle={(title: string) => {
              Panel.title = title;
            }} /></div>
          ) : (
            <CenterXY key={Panel.path}>
              <Alert message="刷新中..." type="info" />
            </CenterXY>
          )
        }))}
      />
    )}</Observer>
  )
}

export default TabPanes
