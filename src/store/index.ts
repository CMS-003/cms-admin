import IApp from './app'
import IUser from './user'
import IMenu from './menu'
import IRouter from './router'
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
  imageLines: ['/manager'],
  baseURL: process.env.NODE_ENV === 'development' ? '' : "/gw/manager",
  project_id: storage.getKey('project_id') || '',
});
// 用户信息状态
const user = IUser.create({ token: { [constant.ACCESS_TOKEN]: storage.getKey('access_token') || '' } });
const page = IPage.create({
  currentPage: storage.getKey('current-tag') || '',
  openedPages: storage.getKey('opened-tags') || [],
  defaultOpened: getOpenedKeys(window.location.pathname)
})
const router = IRouter.create();
const menu = IMenu.create();
const component = IComponent.create();
const project = IProject.create();

async function getBoot() {
  await new Promise((resolve, reject) => {
    import('../api').then(async ({ default: apis }: any) => {
      const bootData = await apis.getBoot();
      store.project.setList(bootData.projects.items)
      store.menu.setTree(bootData.tree.children[0])
      store.component.setTypes(bootData.types.items)
      resolve(true)
    }).catch((e) => {
      reject(e)
    })
  })

}
const store = {
  app,
  user,
  menu,
  router,
  page,
  component,
  project,
  getBoot,
}

export default store;