import { useCallback, useEffect } from "react";
// import { addOpenedMenu, setOpenKey, setSelectKey, setCurrentPath } from "@/store/menu/action";
import { useDidRecover } from "react-router-cache-route"
import Error from "../pages/error";
import { Spin } from "antd";
import store from "../store";
import { useNavigate, useLocation  } from "react-router-dom";
import { MenuItem } from "../types";


interface Props {
  path?: string
  title?: string
  pageKey: string
  menuList: Array<MenuItem>
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
  const history = useNavigate ()
  const location = useLocation()
  const openMenu = store.router.getOpenedMenu()
  const setPath = useCallback((path: string) => {
    store.router.setCurrentPath(path);
  }, [store.router.currentPath]);
  const setOpenKeys = useCallback((val: string) => (store.router.setOpenKey(val)), [])
  const setSelectedKeys = useCallback((val: string[]) => (store.router.setSelectKey(val)), [])
  const addOpenedMenuFn = useCallback((val: object) => (store.router.addOpenedMenu(val)), [])

  const pushMenu = useCallback((info: string, key: string, path: string, title: string) => {
    if (!info) {
      addOpenedMenuFn({ key, path, title })
    }
  }, [addOpenedMenuFn])

  const scrollPage = useCallback(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [])

  const setInfo = useCallback(() => {
    if (!title) {
      return;
    }
    const { pathname, hash, search } = location;
    document.title = title;
    const pagePath = pathname + (hash || search);
    const findInfo = openMenu.find((i) => i.path === pagePath);
    setPath(pagePath)
    setSelectedKeys([String(pageKey)]);
    let openkey = ''; // getMenuParentKey(menuList, pageKey);
    setOpenKeys(openkey);
    pushMenu(findInfo, pageKey, pagePath, title);
  }, [history, openMenu, menuList, title, pageKey, setOpenKeys, setPath, setSelectedKeys, pushMenu])

  const init = useCallback(() => {
    setInfo()
    scrollPage()
  }, [setInfo, scrollPage])

  useEffect(init, [init])

  useDidRecover(init, [init])

  const hasPath = !menuList.find(
    (m) => (m['parent_path'] || "") + m['path'] === pagePath
  );

  if (hasPath && pagePath !== "/" && pagePath !== "*") {
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
