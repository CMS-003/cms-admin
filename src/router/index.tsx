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

type IPanel = {
  title?: string;
  path: string,
  closable?: boolean;
  Content?: any;
}

function getKeyName(key: string): IPanel {
  return Pages[key] || {
    title: '404',
    Content: function () {
      return <ErrorPage status="404" subTitle="?" errTitle="Not Found" />
    },
    closable: true,
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

const LoadableComponentPage = Loadable({
  loader: () => import('@/pages/component'),
  loading: LoadingPage,
});

const LoadableComponentTypePage = Loadable({
  loader: () => import('@/pages/component/type'),
  loading: LoadingPage,
});

const Pages: { [key: string]: IPanel } = {
  '/dashboard': {
    title: '首页',
    Content: HomePage,
    closable: false,
    path: '/dashboard'
  },
  '/oauth/success': {
    title: '授权成功',
    closable: true,
    Content: OAuthSuccessPage,
    path: '/oauth/success'
  },
  '/oauth/fail': {
    title: '授权失败',
    closable: true,
    Content: OAuthFailPage,
    path: '/oauth/fail'
  },
  '/config': {
    title: '配置管理',
    Content: () => <LoadableConfigPage />,
    closable: true,
    path: '/config'
  },
  '/project': {
    title: '项目管理',
    Content: () => <LoadableProjectPage />,
    closable: true,
    path: '/project'
  },
  '/component/data': {
    title: '组件管理',
    Content: () => <LoadableComponentPage />,
    closable: true,
    path: '/component/data'
  },
  '/component/type': {
    title: '组件类型',
    Content: () => <LoadableComponentTypePage />,
    closable: true,
    path: '/component/type'
  },
  '/template/form': {
    title: '表单页',
    Content: () => <LoadableTemplateForm />,
    closable: true,
    path: '/template/form'
  },
  '/template/page': {
    title: '模板页',
    Content: () => <LoadableTemplatePage />,
    closable: true,
    path: '/template/page'
  },
  '/template/editable': {
    title: '可视化编辑',
    Content: () => <LoadableEditable />,
    closable: true,
    path: '/template/editable'
  },
  '/result/404': {
    title: '',
    Content: function () {
      return <ErrorPage status="404" subTitle="?" errTitle="Not Found" />
    },
    closable: true,
    path: '/result/404'
  },
  '/user/bind': {
    title: '第三方账号绑定',
    Content: () => <LoadableUserBind />,
    closable: true,
    path: '/user/bind'
  }
}

// 多页签组件
const TabPanes: FC = () => {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const fullPath = pathname + search
  const local = useLocalStore<{
    activeKey: string;
    pushPanel(pane: IPanel): void;
    setActiveKey(arg0: string): void;
    saveTags(panels: IPanel[]): void;
    isReload: boolean;
    reloadPath: string;
    operateKey: string;
    setPanel(remain_panels: IPanel[]): void;
    panels: IPanel[]
  }>(() => ({
    reloadPath: '',
    panels: [],
    activeKey: store.page.currentTag,
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
    setActiveKey(key: string) {
      local.activeKey = key;
    },
    pushPanel(page: IPanel) {
      this.panels.push(page);
    }
  }));
  const resetTabs = useCallback((): void => {
    store.page.openedTags.forEach(tag => {
      if (Pages[tag]) {
        if (-1 !== local.panels.findIndex(pane => pane.path === tag)) {
          // 重复render处理
          return
        }
        const pane = getKeyName(tag)
        local.pushPanel(pane)
      }
    })
    if (Pages[pathname] && !store.page.openedTags.includes(pathname)) {
      const pane = getKeyName(pathname)
      local.pushPanel(pane)
      store.page.addTag(pathname)
    }
    local.setActiveKey(store.page.openedTags.includes(pathname) ? pathname : '/dashboard')
  }, [local, pathname])

  // 初始化页面
  useEffectOnce(() => {
    resetTabs()
  })

  // 移除tab
  const remove = (targetKey: string): void => {
    const delIndex = local.panels.findIndex(
      (item: IPanel) => item.path === targetKey
    )
    local.panels.splice(delIndex, 1)
    if (targetKey !== pathname) {
      return
    }
    // 删除当前tab，地址往前推
    const nextPath = store.page.openedTags[delIndex - 1] || store.page.openedTags[delIndex - 1] || '/dashboard'
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

    local.reloadPath = (pathname + search)
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
    const newPath = pathname + search
    if (store.page.currentTag === pathname) {
      return;
    }
    store.page.setCurrentTag(pathname)
    // 当前的路由和上一次的一样，无效的新tab，return
    if (pathname === local.activeKey || !Pages[pathname]) {
      return
    };

    // 保存这次的路由地址
    local.setActiveKey(pathname)

    const index = local.panels.findIndex(
      (_: IPanel) => _.path === pathname
    )

    // 新tab已存在，重新覆盖掉（解决带参数地址数据错乱问题）
    if (index > -1) {
      local.panels[index].path = newPath
      local.setActiveKey(pathname)
      return
    }
    // 添加新tab并保存起来
    local.pushPanel(Pages[pathname])
    local.saveTags(local.panels)
    local.setActiveKey(pathname)
  }, [local, pathname, resetTabs, search])

  // const isDisabled = () => local.activeKey === '/dashboard'
  // tab右击菜单
  const menu = (
    <Menu
      items={[
        {
          key: 'refresh',
          icon: <Acon icon="ReloadOutlined" />,
          label: '刷新',
          disabled: false,
        },
        {
          key: 'close',
          icon: <Acon icon="CloseOutlined" />,
          label: '关闭',
        },
        {
          key: 'closeOther',
          icon: <Acon icon="CloseOutlined" />,
          label: '关闭其他',
        },
        {
          key: 'closeAll',
          icon: <Acon icon="CloseOutlined" />,
          label: '关闭所有',
        },
      ]}
      onClick={e => {
        // e.domEvent.stopPropagation()
        if (e.key === 'refresh') {
          refreshTab()
        } else if (e.key === 'close') {
          remove(local.activeKey)
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
        activeKey={local.activeKey}
        style={{ height: '100%', overflow: 'hidden' }}
        className="tag-page"
        tabBarStyle={{ marginBottom: 0 }}
        hideAdd
        onChange={(path: string): void => {
          local.setActiveKey(path)
        }}
        onEdit={(targetKey: string | any, action: string) => {
          action === 'remove' && remove(targetKey)
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
        onTabClick={(targetKey: string) => {
          if (targetKey === local.activeKey) {
            return;
          }
          const { path } = local.panels.filter(
            (item: IPanel) => item.path === targetKey
          )[0]
          navigate(path)
        }}
        type="editable-card"
        size="small"
        items={local.panels.map((Panel, i) => ({
          key: Panel.path,
          label: Panel.title,
          children: local.reloadPath !== Panel.path ? (
            <div key={Panel.path} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}><Panel.Content key={Panel.path} path={Panel.path} store={store} /></div>
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
