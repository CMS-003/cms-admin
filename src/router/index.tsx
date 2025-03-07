import React, {
  FC,
  useEffect,
  useCallback,
} from 'react'
import { useEffectOnce } from 'react-use';
import { useLocation, useNavigate } from 'react-router-dom'
import { Tabs, Alert, Dropdown, Menu, Spin } from 'antd'

import { Observer, useLocalObservable } from 'mobx-react'
import { ISimpleType, IMSTArray } from 'mobx-state-tree'
import store from '@/store'

import HomePage from '@/pages/dashboard'
import ErrorPage from '@/pages/error'
import { CenterXY } from '@/components/style';
import OAuthSuccessPage from '@/pages/oauthResult/success';
import OAuthFailPage from '@/pages/oauthResult/fail';
import Loadable from 'react-loadable';
import { TitleContext } from '@/groups/context';

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

function getPanelByPath(path: string): IPanel {
  const [pathname, _search] = path.split('?');
  const [, id = ''] = /^\/manager\/dynamic\/([^\/]+)[/]?$/.exec(pathname) || [];
  const Page = id ? Templates['/manager/dynamic/:id'] : Templates[pathname];
  return Page ? {
    title: Page.title,
    Content: Page.Content,
    path,
    id,
    closable: Page.closable,
  } : {
    title: '404',
    Content: function () {
      return <ErrorPage status="404" subTitle="?" errTitle="Not Found" />
    },
    closable: true,
    id,
    path
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
const LoadableTablesPage = Loadable({
  loader: () => import("@/pages/table/index"),
  loading: LoadingPage,
});
const LoadableTableDetailPage = Loadable({
  loader: () => import("@/pages/table/detail"),
  loading: LoadingPage,
});

const templateArr: IPage[] = [
  { title: '首页', Content: HomePage, closable: false, route: process.env.PUBLIC_URL + '/dashboard' },
  { title: '授权成功', Content: OAuthSuccessPage, closable: true, route: process.env.PUBLIC_URL + '/oauth/success' },
  { title: '授权失败', Content: OAuthFailPage, closable: true, route: process.env.PUBLIC_URL + '/oauth/fail' },
  { title: '配置管理', Content: (props: any) => <LoadableConfigPage  {...props} />, closable: true, route: process.env.PUBLIC_URL + '/config' },
  { title: '所有表', Content: (props: any) => <LoadableTablesPage {...props} />, closable: true, route: process.env.PUBLIC_URL + '/tables/all' },
  { title: '表定义', Content: (props: any) => <LoadableTableDetailPage {...props} />, closable: true, route: process.env.PUBLIC_URL + '/tables/detail' },
  { title: '项目管理', Content: (props: any) => <LoadableProjectPage {...props} />, closable: true, route: process.env.PUBLIC_URL + '/project' },
  { title: '组件管理', Content: (props: any) => <LoadableComponentPage {...props} />, closable: true, route: process.env.PUBLIC_URL + '/component/data' },
  { title: '组件类型', Content: (props: any) => <LoadableComponentTypePage {...props} />, closable: true, route: process.env.PUBLIC_URL + '/component/type' },
  { title: '模板页', Content: (props: any) => <LoadableTemplatePage {...props} />, closable: true, route: process.env.PUBLIC_URL + '/template/page' },
  { title: '动态页', Content: (props: any) => <LoadableDynamicPage {...props} />, closable: true, route: process.env.PUBLIC_URL + '/dynamic/:id' },
  { title: '可视化编辑', Content: (props: any) => <LoadableEditable {...props} />, closable: true, route: process.env.PUBLIC_URL + '/template/editable' },
  { title: '系统日志', Content: (props: any) => <LoadableLogSystem {...props} />, closable: true, route: process.env.PUBLIC_URL + '/log/system' },
  { title: '验证码', Content: (props: any) => <LoadableVerification {...props} />, closable: true, route: process.env.PUBLIC_URL + '/log/verification-code' },
  { title: '', Content: function (props: any) { return <ErrorPage status="404" subTitle="?" errTitle="Not Found" {...props} /> }, closable: true, route: process.env.PUBLIC_URL + '/result/404' },
  { title: '第三方账号绑定', Content: (props: any) => <LoadableUserBind {...props} />, closable: true, route: process.env.PUBLIC_URL + '/user/bind' },
];

const Templates: { [key: string]: IPage } = {};
templateArr.forEach(p => {
  Templates[p.route] = p;
});

// 多页签组件
const TabPanes: FC = () => {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const fullPath = pathname + search
  const local = useLocalObservable<{
    pushPanel(pane: IPanel): void;
    saveTags(panels: IPanel[]): void;
    isReload: boolean;
    reloadPath: string;
    operateKey: string;
    setPanel(remain_panels: IPanel[]): void;
    setByIndex: Function;
    panels: IPanel[],
    setReloadPath: Function;
    setPanelTitle: Function;
    remPanel: Function;
  }>(() => ({
    reloadPath: '',
    panels: [],
    isReload: true,
    operateKey: '',
    setReloadPath(p: string) {
      local.reloadPath = p;
    },
    saveTags(panels: IPanel[]) {
      local.panels = panels
      // 记录当前打开的tab
      const tags: string[] = [];
      local.panels.map((item: IPanel) => item.path).forEach(path => {
        if (!tags.includes(path)) {
          tags.push(path)
        }
      })
      store.page.setOpenedPages(tags as IMSTArray<ISimpleType<string>>)
    },
    setPanel(pages: IPanel[]) {
      local.panels = pages
    },
    setByIndex(index: number, key: keyof IPanel, value: IPanel) {
      local.panels[index][key] = value;
    },
    pushPanel(page: IPanel) {
      this.panels.push(page);
    },
    remPanel(i: number) {
      local.panels.splice(i, 1)
    },
    setPanelTitle(panel: IPanel, title: string) {
      panel.title = title;
    },
  }));
  const resetTabs = useCallback((): void => {
    // search 参数处理
    if (Templates[pathname] && !store.page.openedPages.includes(fullPath)) {
      store.page.addPage(fullPath)
    }
    store.page.setCurrentPage(store.page.openedPages.includes(fullPath) ? fullPath : process.env.PUBLIC_URL + '/dashboard')
    store.page.openedPages.forEach((tag, i) => {
      if (store.page.openedPages.findIndex(v => v === tag) !== i) return;
      const [new_pathname] = tag.split('?');
      if ((Templates[new_pathname] || new_pathname.startsWith('/manager/dynamic')) && local.panels.findIndex(p => p.path === tag) === -1) {
        const pane = getPanelByPath(tag)
        local.pushPanel(pane)
      }
    })
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
    local.remPanel(delIndex)
    // 删除当前tab，地址往前推
    const nextPath = store.page.openedPages[delIndex - 1] || store.page.openedPages[delIndex - 1] || process.env.PUBLIC_URL + '/dashboard'
    local.saveTags(local.panels)
    // 如果当前tab关闭后，上一个tab无权限，就一起关掉
    // if (!isAuthorized(tabKey) && nextPath !== '/') {
    //   remove(tabKey)
    //   navigate(store.page.openedTags[delIndex - 2])
    // } else {
    //   navigate(nextPath)
    // }
    if (targetTag !== fullPath) {
      return
    }
    navigate(nextPath)
  }

  // 刷新当前 tab
  const refreshTab = (): void => {
    local.isReload = true
    setTimeout(() => {
      local.isReload = false
    }, 1000)

    local.setReloadPath(fullPath)
    setTimeout(() => {
      local.setReloadPath('')
    }, 500)
  }

  // 关闭其他或关闭所有
  const removeAll = async (isCloseAll?: boolean) => {
    const remain_panels = isCloseAll ? [] : local.panels.filter(pane => pane.path === local.operateKey)
    local.setPanel(remain_panels)
  }

  useEffect(() => {
    // 当前的路由和上一次的一样，无效的新tab，return
    if (fullPath === store.page.currentPage) {
      return
    };
    // 保存这次的路由地址
    store.page.setCurrentPage(fullPath)

    const index = local.panels.findIndex(
      (_: IPanel) => _.path === fullPath
    )

    // 新tab已存在，重新覆盖掉（解决带参数地址数据错乱问题）
    if (index > -1) {
      local.setByIndex(index, 'path', fullPath)
      return
    }
    // 添加新tab并保存起来
    const Page = getPanelByPath(fullPath);
    local.pushPanel(Page)
    local.saveTags(local.panels)
  }, [local, pathname, resetTabs, search])

  // const isDisabled = () => store.page.currentPage === '/dashboard'
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
          remove(store.page.currentPage)
        } else if (e.key === 'closeOther') {
          removeAll(false)
        } else if (e.key === 'closeAll') {
          removeAll(true)
        }
      }}
    />
  );
  // context 里匿名函数会造成每次重新渲染
  const setTitle = useCallback((path: string, title: string) => {
    local.panels.forEach(p => {
      if (p.path === path) {
        local.setPanelTitle(p, title)
      }
    })
  }, [])
  return (
    <Observer>{() => (
      <Tabs
        activeKey={store.page.currentPage}
        style={{ height: '100%', overflow: 'hidden' }}
        className="tag-page"
        tabBarStyle={{ marginBottom: 0 }}
        hideAdd
        destroyInactiveTabPane={false}
        onChange={(path: string): void => {
          store.page.setCurrentPage(path)
        }}
        onEdit={(targetTag: string | any, action: string) => {
          action === 'remove' && remove(targetTag)
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
          if (targetTag === store.page.currentPage) {
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
            <div key={Panel.path} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <TitleContext.Provider value={setTitle}>
                <Panel.Content
                  key={Panel.path}
                  path={Panel.path}
                  id={Panel.id}
                />
              </TitleContext.Provider>
            </div>
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
