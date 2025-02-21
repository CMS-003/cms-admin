# admin-ts

## TODO: 任务计划大纲

- ✅ shttp封装
- ✅ 全局store设定
- ✅ 动态菜单
- ✅ tab标签页(路由缓存)
- ✅ path alias @
- ✅ api与mock(axios封装,业务错误码/token/拦截器)
- ✅ store(mobx-state-tree,user/config的model)
- ✅ 全局types
- ✅ utils
- ✅ 默认页(登录注册,错误页,无权限页,dashboard)
- ✅ Acon组件
- ✅ 布局layout
- ✅ 模板页实时修改渲染
- 权限控制
- ✅ 拖拽排序
- 完善组件类型的视图
- ✅ 模板分类视图
- novel前端项目重构
- ✅ 可视化修改后端菜单,成功后左侧应当自动更新
- ✅ 可视化编辑后,再修改保存提示无变化
- ✅ source和setSource
- ✅ widget的类型问题整数1和字符串1
- page root info
- ✅ sort & editable 事件.
  - enter时显示popover层比右键+dragHandler好
- ✅ dnd 克隆模式需设置整个拖动(记录全局可拖动id,其他都不可拖动)
- 自己开发SortableList
  - ✅ 能控制水平垂直方向
  - ✅ 移动时让出占位符(translate)
  - ✅ 无侵入renderItem
  - ✅ drag时clone复制dom结构(可指定复制父节点),不显示真实节点
  - ❌ drop超出容器要锁定边界(超出容器无法捕捉)
  - ❌ drop时要有动画(默认回弹不好取消)
  - drag事件改为mouse事件
  - 判断方式由中心点改为前后边界
  - 我还是太菜。
    - 平移动画造成重复触发
    - 先去掉动画：✅ 偏移效果 样式bug：先瞬移到右方，然后延时300恢复
    - 去掉偏移判断：✅ 回弹效果
  - 不能一样搞一点,按设计路线走
    - 松开时,dragging=false,计数补偿距离,交互顺序(dragElement不能有动画),异步设置回弹到 0
- 编辑面板
  - 基础：title/desc/parent_id/_id/
  - 数据: api/resources/widget_field/widget_value/widget_type/layout(1/-1)/flex(0/1)/
  - 事件: widget_action/
  - 

## 代码库学习

- ✅ mobx,mobx-react
- ✅ loadable
- echarts
- ✅ axios
- ❌ react-router-cache-route(没必要用route实现标签页)
- http-proxy-middleware
- ✅ 列表编辑中列widget支持添加子组件(主要是按钮)
- ✅ JsonSchema编辑自定义组件

## 代码流程

- 通过url进入app页面
- 通过缓存数据判断是否登录: 是,这请求初始化; 否,跳转到登录页
  - 登录: 请求成功,缓存数据,跳转到首页
  - 注册:
  - 忘记密码:
- 请求初始化:
  - 菜单数据(重整:openedMenus,openedTabs).show bread,show tab

## 添加自定义页面步骤

- page文件夹添加页面
- router文件配置路由
- 可视化后台菜单添加菜单项

## 表单与列表

- ✅ 列模板使用hbs语法

## 问题与方案

- 引入antd的css报错: `Failed to parse source map: 'webpack://antd/./components/config-provider/style/index.less' URL is not supported`
  - `import 'antd/dist/antd.min.css`
- react-router-dom@v6: BrowserRouter放最顶级,使用useNavigate跳转才有响应
- alias: 怎么没有ts版本的?官方就是不支持要搞个react-rewired
- react.StrictMode 重复渲染。只在开发中出现
- 开发时保存文件会触发useEffect和useEffectOnce,造成标签页重复
- getSnapshot的参数是model创建的，useLocalObservable转object用到的是toJS
