import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Route } from "react-router-dom";
import { CacheRoute, CacheSwitch } from "react-router-cache-route";
import loadable, { LoadableComponent } from "@loadable/component";
import { MenuItem } from "@/types";


export interface IRouter {
  components: LoadableComponent<any> | React.ReactElement | React.ComponentClass<any>
  path: string
  key?: any
  title?: string | any
  alive?: string | any
  [name: string]: any
}
const Error = loadable(() => import("../pages/error"));

const menus: IRouter[] = [
  {
    path: "/",
    key: "index",
    to: "/details/person",
    components: Error,
  },
  {
    path: "/result/404",
    components: Error,
  },
  {
    path: "/result/403",
    status: "403",
    errTitle: "403",
    subTitle: "Sorry, you don't have access to this page.",
    components: Error,
  },
  {
    path: "/result/500",
    status: "500",
    errTitle: "500",
    subTitle: "Sorry, the server is reporting an error.",
    components: Error,
  },
  {
    path: "*",
    title: "页面不存在",
    key: "404",
    alive: "true",
    components: Error,
  },
];

export default function Router() {
  const setStateMenuList = useCallback((list: MenuItem[]) => setUserMenu(list), [])
  const [localMenus, setMergeList] = useState<IRouter[]>([]);// 本地 和 接口返回的路由列表 合并的结果
  const [userMeus, setAjaxUserMenuList] = useState<IRouter[]>([]); // 网络请求回来的 路由列表

}