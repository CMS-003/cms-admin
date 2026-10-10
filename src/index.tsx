import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import './index.css';
import 'antd/dist/reset.css';
import App from './App';
import { ConfigProvider } from 'antd';

// 应用主题。抽出来是因为要注册两份：
//   1) 下面 JSX 里的 ConfigProvider —— 应用树用
//   2) ConfigProvider.config({ theme }) —— 静态方法的弹层用
const theme = {
  token: {
    colorBgContainerDisabled: '#eee'
  }
};

ConfigProvider.config({
  theme,
  // ★ 这一行就是让警告消失的关键。
  // message / notification / Modal.confirm 这些静态方法渲染在 antd 自己创建的
  // 独立 React root 里，拿不到应用树上的 ConfigProvider。antd 检测到项目里存在
  // 动态主题（ConfigProvider theme）时会提示 "Static function can not consume
  // context like dynamic theme. Please use 'App' component instead."，而它的判断
  // 条件其实是 `!global.holderRender` —— 只要这里显式声明了 holderRender，
  // 就说明静态方法的 holder 已经有自己的 context 入口，警告自动短路。
  // 声明后静态弹层会被渲染在 antd 内部 <ConfigProvider theme={globalTheme}> 之下，
  // 所以上面的 theme 也对 message/notification 生效。
  // 注意：仅 theme / prefixCls / iconPrefixCls 会传递给静态方法；
  // locale、getPopupContainer 等应用树上的其它配置它们依然拿不到。
  holderRender: (children) => children,
});
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <BrowserRouter future={{ v7_relativeSplatPath: true, }}>
    <ConfigProvider theme={theme}>
      <App />
    </ConfigProvider>
  </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
