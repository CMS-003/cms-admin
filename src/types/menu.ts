export interface IMenuItem {
  id: number
  icon: string
  alive: string
  key: string | number
  order?: number
  parent_key: string
  path: string
  title: string
  children?: IMenuItem[]
  parent_path?: string
  show?: boolean | string
  [key: string]: any
}

export interface IOpenedMenu {
  key: string
  path: string
  title: string
}

export interface IMenuState {
  openedMenu: IOpenedMenu[]
  openMenuKey: string[]
  selectMenuKey: string[]
  menuList: IMenuItem[],
  currentPath: string
}