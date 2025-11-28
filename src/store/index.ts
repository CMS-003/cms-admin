import IApp from './app'
import IUser from './user'
import IMenu from './menu'
import IRouter from './router'
import IComponent from './component'
import IProject from './project'
import IGlobal from './global'
import constant from '../constant'
import storage from '../utils/storage'

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
  imageLines: [''],
  videoLines: [''],
  baseURL: "",
  project_id: storage.getKey('project_id') || '',
});
// 用户信息状态
const user = IUser.create({ token: { [constant.ACCESS_TOKEN]: storage.getKey('access_token') || '', [constant.REFRESH_TOKEN]: storage.getKey('refresh_token') || '' } });

const router = IRouter.create({
  currentPath: storage.getKey('current-path') || '',
  openedPanels: storage.getKey('opened-panels') || [],
  openedMenu: storage.getKey('opened-menu') || [],
});
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
const global = IGlobal.create({
  config: {
    RESOURCE: {
      STATUS: [
        { label: '已废弃', value: 0 },
        { label: '已创建', value: 1 },
        { label: '下载中', value: 2 },
        { label: '已失败', value: 3 },
        { label: '已成功', value: 4 },
      ],
      TYPE: [
        { label: '文章', value: 1 },
        { label: '视频', value: 2 },
        { label: '图片', value: 3 },
        { label: '漫画', value: 4 },
        { label: '电影', value: 5 },
        { label: '小说', value: 6 },
        { label: '音乐', value: 7 },
        { label: '私人', value: 8 },
        { label: '动画', value: 9 },
        { label: '画册', value: 10 },
        { label: '帖子', value: 11 },
        { label: '短视频', value: 12 },
        { label: '用户', value: 13 },
        { label: '文件', value: 14 },
      ]
    },
    TASK: {
      STATUS: [
        { label: '已废弃', value: 0 },
        { label: '已创建', value: 1 },
        { label: '下载中', value: 2 },
        { label: '已失败', value: 3 },
        { label: '已成功', value: 4 },
        { label: '已完成', value: 5 },
      ],
      TRANSCODE: [
        { label: '无需转码', value: 0 },
        { label: '待转码', value: 1 },
        { label: '转码中', value: 2 },
        { label: '已失败', value: 3 },
        { label: '已成功', value: 4 },
      ]
    },
    API_STATUS: [
      { label: '已废弃', value: 0 },
      { label: '开发中', value: 1 },
      { label: '运行中', value: 2 },
    ],
    SPIDER_STATUS: [
      { label: '已废弃', value: 0 },
      { label: '开发中', value: 1 },
      { label: '测试中', value: 2 },
      { label: '运行中', value: 3 },
    ],
    USER_STATUS: [
      { label: '注销', value: 0 },
      { label: '正常', value: 1 },
    ],
    QUERY: {
      STATUS: [
        { label: '已废弃', value: 0 },
        { label: '开发中', value: 1 },
        { label: '运行中', value: 2 },
      ],
      TYPE: [
        { label: '查询', value: 'where' },
        { label: '排序', value: 'sort' },
        { label: '数量', value: 'limit' },
        { label: '聚合', value: 'aggregate' },
      ]
    },
    SCHEDULE_STATUS: [
      { label: '已废弃', value: 0 },
      { label: '开发中', value: 1 },
      { label: '自动', value: 2 },
      { label: '手动', value: 3 },
    ],
    COUNTRY: [
      {
        "value": "CN",
        "label": "中国"
      },
      {
        "value": "JP",
        "label": "日本"
      },
      {
        "value": "HK",
        "label": "香港"
      },
      {
        "value": "TW",
        "label": "台湾"
      },
      {
        "value": "US",
        "label": "美国"
      },
      {
        "value": "GB",
        "label": "英国"
      },
      {
        "value": "FR",
        "label": "法国"
      },
      {
        "value": "TH",
        "label": "泰国"
      },
      {
        "value": "IN",
        "label": "印度"
      },
    ]
  }
});

const store = {
  app,
  user,
  menu,
  router,
  global,
  component,
  project,
  getBoot,
}

export default store;