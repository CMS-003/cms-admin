import React, {
  FC,
  useEffect,
  useCallback,
} from 'react'
import { useEffectOnce } from 'react-use';
import { useLocation, useNavigate } from 'react-router-dom'
import { Tabs, Alert, Dropdown, Menu } from 'antd'

import { SyncOutlined } from '@ant-design/icons'
import { Observer, useLocalObservable } from 'mobx-react'
import { ISimpleType, IMSTArray } from 'mobx-state-tree'
import store from '@/store'

import HomePage from '@/pages/dashboard'
import ComponentPage from '@/pages/component'
import ComponentTypePage from '@/pages/component/type'
import ComponentTemplatePage from '@/pages/component/template'
import ErrorPage from '@/pages/error'
import { CenterXY } from '@/components/style';
import ConfigPage from '@/pages/config';
import ProjectPage from '@/pages/project';

type PaneItem = {
  title?: string;
  path: string,
  closable?: boolean;
  content?: any;
}

function getKeyName(key: string): PaneItem {
  return Pages[key] || null
}

const Pages: { [key: string]: PaneItem } = {
  '/dashboard': {
    title: '首页',
    content: HomePage,
    closable: false,
    path: '/dashboard'
  },
  '/config': {
    title: '配置管理',
    content: ConfigPage,
    closable: true,
    path: '/config'
  },
  '/project': {
    title: '项目管理',
    content: ProjectPage,
    closable: true,
    path: '/project'
  },
  '/component/data': {
    title: '组件管理',
    content: ComponentPage,
    closable: true,
    path: '/component/data'
  },
  '/component/type': {
    title: '组件类型',
    content: ComponentTypePage,
    closable: true,
    path: '/component/type'
  },
  '/component/template': {
    title: '模板页',
    content: ComponentTemplatePage,
    closable: true,
    path: '/component/template'
  },
  '/result/404': {
    title: '',
    content: function () {
      return <ErrorPage status="404" subTitle="?" errTitle="Not Found" />
    },
    closable: true,
    path: '/result/404'
  },
}

// 多页签组件
const TabPanes: FC = () => {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const fullPath = pathname + search

  const local = useLocalObservable<{
    reloadPath: string,
    isReload: boolean,
    activeKey: string,
    operateKey: string,
    saveTags(tagPages: PaneItem[]): void;
    tagPages: PaneItem[];
  }>(() => ({
    reloadPath: '',
    tagPages: [],
    activeKey: store.page.currentTag,
    isReload: false,
    operateKey: '',
    saveTags(tagPages: PaneItem[]) {
      this.tagPages = tagPages
      // 记录当前打开的tab
      const tags = this.tagPages.map(item => item.path) as IMSTArray<ISimpleType<string>>;
      store.page.setOpenedTags(tags)
    },
  }))

  // 从本地存储中恢复已打开的tab列表
  const resetTabs = useCallback((): void => {
    store.page.openedTags.forEach(tag => {
      if (Pages[tag]) {
        if (-1 !== local.tagPages.findIndex(pane => pane.path === tag)) {
          // 重复render处理
          return
        }
        const pane = getKeyName(tag)
        local.tagPages.push(pane)
      }
    })
    if (Pages[pathname] && !store.page.openedTags.includes(pathname)) {
      const pane = getKeyName(pathname)
      local.tagPages.push(pane)
      store.page.addTag(pathname)
    }
    local.activeKey = store.page.openedTags.includes(pathname) ? pathname : '/dashboard'
  }, [local, pathname])

  // 初始化页面
  useEffectOnce(() => {
    resetTabs()
  })

  // 移除tab
  const remove = (targetKey: string): void => {
    const delIndex = local.tagPages.findIndex(
      (item: PaneItem) => item.path === targetKey
    )
    local.tagPages.splice(delIndex, 1)
    if (targetKey !== pathname) {
      return
    }
    // 删除当前tab，地址往前推
    const nextPath = store.page.openedTags[delIndex - 1] || store.page.openedTags[delIndex - 1] || '/dashboard'
    local.saveTags(local.tagPages)
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
    const path = local.operateKey
    const now = local.tagPages.filter(pane => pane.path === path)
    local.tagPages = now
    navigate(isCloseAll ? '/dashboard' : path)
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
    local.activeKey = pathname

    const index = local.tagPages.findIndex(
      (_: PaneItem) => _.path === pathname
    )

    // 新tab已存在，重新覆盖掉（解决带参数地址数据错乱问题）
    if (index > -1) {
      local.tagPages[index].path = newPath
      local.activeKey = pathname
      return
    }
    // 添加新tab并保存起来
    local.tagPages.push(Pages[pathname])
    local.saveTags(local.tagPages)
    local.activeKey = pathname
  }, [local, pathname, resetTabs, search])

  // const isDisabled = () => local.activeKey === '/dashboard'
  // tab右击菜单
  const menu = (
    <Menu
      items={[
        {
          key: 'refresh',
          // icon: <ReloadOutlined />,
          label: '刷新',
          disabled: false,
        },
        {
          key: 'close',
          // icon: <CloseOutlined />,
          label: '关闭',
        },
        {
          key: 'closeOther',
          // icon: <CloseOutlined />,
          label: '关闭其他',
        },
      ]}
      onClick={e => {
        // e.domEvent.stopPropagation()
        if (e.key === 'refresh') {
          refreshTab()
        } else if (e.key === 'close') {
          remove(local.activeKey)
        } else if (e.key === 'closeOther') {
          removeAll()
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
          local.activeKey = (path)
        }}
        onEdit={(targetKey: string | any, action: string) => {
          action === 'remove' && remove(targetKey)
        }}
        onTabClick={(targetKey: string) => {
          if (targetKey === local.activeKey) {
            return;
          }
          const { path } = local.tagPages.filter(
            (item: PaneItem) => item.path === targetKey
          )[0]
          navigate(path)
        }}
        type="editable-card"
        size="small"
      >
        {local.tagPages.map((pane) => (
          <Tabs.TabPane
            closable={pane.closable || false}
            key={pane.path}
            tab={
              <Dropdown
                overlay={menu}
                placement="bottomLeft"
                trigger={['contextMenu']}
              >
                <span onContextMenu={(e) => {
                  e.preventDefault()
                  local.operateKey = pane.path
                }}>
                  {local.isReload &&
                    pane.path === fullPath &&
                    pane.path !== '/403' && (
                      <SyncOutlined title="刷新" spin={local.isReload} />
                    )}
                  {pane.title}
                </span>
              </Dropdown>
            }
          >
            {local.reloadPath !== pane.path ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}><pane.content path={pane.path} /></div>
            ) : (
              <CenterXY>
                <Alert message="刷新中..." type="info" />
              </CenterXY>
            )}
          </Tabs.TabPane>
        ))}
      </Tabs>
    )}</Observer>
  )
}

export default TabPanes
