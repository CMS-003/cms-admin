import IApp from './app'
import IUser from './user'
import IMenu from './menu'
import IComponent from './component'
import IProject from './project'
import constant from '../constant'
import storage from '../storage'

// app状态
const app = IApp.create({
  isSignIn: false,
  isDebug: false,
  lastVisitedAt: 0,
});
// 用户信息状态
const user = IUser.create({ token: { [constant.ACCESS_TOKEN]: storage.getKey('access_token') || '' } });
const menu = IMenu.create();
const component = IComponent.create();
const project = IProject.create()

const store = {
  app,
  user,
  menu,
  component,
  project,
}

export default store;