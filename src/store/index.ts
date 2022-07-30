import IApp from './app'
import IUser from './user'
import IMenu from './menu'
import IPage from './page'
import IComponent from './component'
import IProject from './project'
import constant from '../constant'
import storage from '../storage'

function getOpenedKeys(path: string): string[] {
  const keys: string[] = [];
  const arr = path.replace(/(^\/)|(\/$)/g, '').split('/')
  while (arr.length > 1) {
    const path = arr.shift()
    if (path) {
      const key = keys.join('/') + '/' + path
      key && keys.push(key)
    }
  }
  return keys;
}

// app状态
const app = IApp.create({
  isSignIn: false,
  isDebug: false,
  lastVisitedAt: 0,
});
// 用户信息状态
const user = IUser.create({ token: { [constant.ACCESS_TOKEN]: storage.getKey('access_token') || '' } });
const page = IPage.create({
  currentTag: storage.getKey('current-tag') || '',
  openedTags: storage.getKey('opened-tags') || [],
  defaultOpened: getOpenedKeys(window.location.pathname)
})
const menu = IMenu.create();
const component = IComponent.create();
const project = IProject.create()

const store = {
  app,
  user,
  menu,
  page,
  component,
  project,
}

export default store;