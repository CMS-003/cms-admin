import { useCallback, useEffect } from "react";
// import { addOpenedMenu, setOpenKey, setSelectKey, setCurrentPath } from "@/store/menu/action";
import { useDidRecover } from "react-router-cache-route"
import Error from "../pages/error";
import { Spin } from "antd";
import store from "../store";
import { useNavigate, useLocation } from "react-router-dom";
import { IMenuItem } from "../types";


interface Props {
  path?: string
  title?: string
  pageKey: string
  menuList: Array<IMenuItem>
  [key: string]: any
}

const fallback = <Spin style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 500,
  fontSize: 24,
}} tip="页面加载中...." />

function Intercept({ menuList, components: Components, title, path: pagePath, pageKey, ...itemProps }: Props) {
  const scrollPage = useCallback(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [])
  const init = useCallback(() => {
    scrollPage()
  }, [scrollPage])

  useEffect(init, [init])

  useDidRecover(init, [init])

  const hasPath = !menuList.find(
    (m) => (m['parent_path'] || "") + m['path'] === pagePath
  );

  if (hasPath && pagePath !== '/manager' && pagePath !== "*") {
    return (
      <Error
        {...itemProps}
        status="403"
        errTitle="权限不够"
        subTitle="Sorry, you are not authorized to access this page."
      />
    );
  }

  return (
    <Components
      {...itemProps}
      fallback={fallback}
    />
  );
}
export default Intercept
