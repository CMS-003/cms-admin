import React, {
  FC,
  useEffect,
  useRef,
  useCallback,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Tabs, Alert, Dropdown, Menu } from 'antd'

import { SyncOutlined } from '@ant-design/icons'
import { Observer, useLocalObservable } from 'mobx-react'
import { ISimpleType, IMSTArray } from 'mobx-state-tree'
import store from '@/store'

import HomePage from '@/pages/dashboard'
import ComponentPage from '../pages/component'
import ComponentTypePage from '../pages/component/type'
import ComponentTemplatePage from '../pages/component/template'
import { useEffectOnce } from 'react-use';

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
    setPanes(panes: PaneItem[]): void;
    setSelectedPanel(pane: { key: string, path: string, closable: boolean }): void;
    panes: PaneItem[];
    selectedPanel: PaneItem;
  }>(() => ({
    reloadPath: '',
    panes: [],
    activeKey: store.page.currentTag,
    isReload: false,
    selectedPanel: { key: '', path: '/', closable: false },

    setPanes(panes: PaneItem[]) {
      this.panes = panes
      // 记录当前打开的tab
      const tags = this.panes.map(item => item.path) as IMSTArray<ISimpleType<string>>;
      store.page.setOpenedTags(tags)
    },
    setSelectedPanel(pane: PaneItem) {

    },
  }))
  const pathRef = useRef<string>('')

  // 从本地存储中恢复已打开的tab列表
  const resetTabs = useCallback((): void => {
    if (Pages[pathname]) {
      if (store.page.openedTags.includes(pathname) && local.panes.findIndex(pane => pane.path === pathname) === -1) {
        const pane = getKeyName(pathname)
        local.panes.push(pane)
        store.page.addTag(pathname)
      }
      local.activeKey = pathname
    } else {
      local.activeKey = ''
    }
    // local.activeKey = store.page.currentTag
  }, [])

  // 初始化页面
  useEffectOnce(() => {
    resetTabs()
  })

  // tab切换
  const onChange = (path: string): void => {
    local.activeKey = (path)
  }

  // 移除tab
  const remove = (targetKey: string): void => {
    const delIndex = local.panes.findIndex(
      (item: PaneItem) => item.path === targetKey
    )
    local.panes.splice(delIndex, 1)
    if (targetKey !== pathname) {
      return
    }
    // 删除当前tab，地址往前推
    const nextPath = store.page.openedTags[delIndex - 1] || store.page.openedTags[delIndex - 1] || '/dashboard'
    local.setPanes(local.panes)
    // 如果当前tab关闭后，上一个tab无权限，就一起关掉
    // if (!isAuthorized(tabKey) && nextPath !== '/') {
    //   remove(tabKey)
    //   navigate(store.page.openedTags[delIndex - 2])
    // } else {
    //   navigate(nextPath)
    // }
    navigate(nextPath)
  }

  // tab新增删除操作
  const onEdit = (targetKey: string | any, action: string) => {
    action === 'remove' && remove(targetKey)
  }

  // tab点击
  const onTabClick = (targetKey: string): void => {
    if (targetKey === local.activeKey) {
      return;
    }
    const { path } = local.panes.filter(
      (item: PaneItem) => item.path === targetKey
    )[0]
    navigate(path)
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
    const { path } = local.selectedPanel
    navigate(isCloseAll ? '/' : path)

    const nowPanes: PaneItem[] = [local.selectedPanel || Pages['/dashboard']]
    local.panes = nowPanes
    local.activeKey = (isCloseAll ? '/dashboard' : path)
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
    pathRef.current = newPath
    local.activeKey = pathname

    const index = local.panes.findIndex(
      (_: PaneItem) => _.path === pathname
    )

    // 新tab已存在，重新覆盖掉（解决带参数地址数据错乱问题）
    if (index > -1) {
      local.panes[index].path = newPath
      // local.setPanes(local.panes)
      local.activeKey = pathname
      return
    }

    // 添加新tab并保存起来
    local.panes.push(Pages[pathname])
    local.setPanes(local.panes)
    local.activeKey = pathname
  }, [local.panes, pathname, resetTabs, search])

  const isDisabled = () => local.selectedPanel.path === '/dashboard'
  // tab右击菜单
  const menu = (
    <Menu
      items={[
        {
          key: 1,
          // icon: <ReloadOutlined />,
          label: '刷新',
          disabled: false,
        },
        {
          key: 2,
          // icon: <CloseOutlined />,
          label: '关闭',
        },
        {
          key: 3,
          // icon: <CloseOutlined />,
          label: '关闭其他',
        },
      ]}
      onClick={e => {
        // e.domEvent.stopPropagation()
        // remove(local.selectedPanel.path)
        // removeAll()
        // removeAll(true)
        console.log(e.key)
      }}
    />
  )
  // 阻止右键默认事件
  const preventDefault = (e: any, panel: { key: string, path: string, closable: boolean }) => {
    e.preventDefault()
    local.setSelectedPanel(panel)
  }
  return (
    <Observer>{() => (
      <div>
        <Tabs
          activeKey={local.activeKey}
          style={{}}
          hideAdd
          onChange={onChange}
          onEdit={onEdit}
          onTabClick={onTabClick}
          type="editable-card"
          size="small"
        >
          {local.panes.map((pane) => (
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
                    // preventDefault(e, pane)
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
                <pane.content path={pane.path} />
              ) : (
                <div style={{ height: '100vh' }}>
                  <Alert message="刷新中..." type="info" />
                </div>
              )}
            </Tabs.TabPane>
          ))}
        </Tabs>
      </div>
    )}</Observer>
  )
}

export default TabPanes
