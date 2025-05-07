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
- ✅ page root info
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
  - ✅ drag事件改为mouse事件
  - ✅ 判断方式由中心点改为前后边界
  - 我还是太菜。
    - ✅ 平移动画造成重复触发(经常会出现问题.因为有时有start事件没有end事件)
    - ✅ 偏移效果
    - ✅ 回弹效果
  - ✅ 去掉renderItem包裹的div
- 编辑面板
  - ✅ 基础：title/desc/parent_id/_id/
  - ✅ 数据: resources/queries/url
  - ✅ 控件: widget_field/widget_value/widget_type/widget_in/widget_refer
    - field 字段名
    - type 字段数据类型.string/number/boolean/object 或 array
    - value
    - refer
    - in body/query
    - action 事件类型
    - method => action 为 FETCH 时,method 是请求 method 类型; 为 MODAL 时,method 是模板 id;为 PREVIEW 时,是预览类型 image/video
  - ✅ 事件: widget_action/
  - ✅ 布局: layout/style
- 重写Table
- ✅ 组件包裹层设计: handler+组件 flex 水平排列,通过 attrs 来控制布局,实际的组件通过 style 布局
- 多可视化编辑页

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
  - 封面显示
  ```handlebars
  <div style="width:120px;height:80px;background:url(
  {{~ store.app.imageLine ~}}
  {{~#if poster~}}
    {{poster}}
  {{~else~}}
    {{~#if thumbnail ~}}
      {{thumbnail}}
    {{~else~}}
      /images/nocover.jpg
    {{~/if~}}
  {{~/if~}}
  ) center center no-repeat;background-size: contain;border-radius:3px;"></div>
  ```

## 问题与方案

- 引入antd的css报错: `Failed to parse source map: 'webpack://antd/./components/config-provider/style/index.less' URL is not supported`
  - `import 'antd/dist/antd.min.css`
- react-router-dom@v6: BrowserRouter放最顶级,使用useNavigate跳转才有响应
- alias: 怎么没有ts版本的?官方就是不支持要搞个react-rewired
- react.StrictMode 重复渲染。只在开发中出现
- 开发时保存文件会触发useEffect和useEffectOnce,造成标签页重复
- getSnapshot的参数是model创建的，useLocalObservable转object用到的是toJS
