export interface MenuItem {
  id: number
  icon: string
  alive: string
  key: string | number
  order?: number
  parent_key: string
  path: string
  title: string
  children?: MenuItem[]
  parent_path?: string
  show?: boolean | string
  [key: string]: any
}

export interface OpenedMenu {
  key: string
  path: string
  title: string
}

export interface MenuState {
  openedMenu: OpenedMenu[]
  openMenuKey: string[]
  selectMenuKey: string[]
  menuList: MenuItem[],
  currentPath: string
}