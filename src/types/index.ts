import type { CSSProperties } from 'react'

export * from "./user"
export * from "./menu"
export * from "./component"
export * from "./editor"
export * from "./tree"
export * from "./project"
export * from "./resource"
export * from "./table"

declare global {
  interface Window {
    goto: (url: string) => void;
    sendCustomEvent: (view_id: string, name: string, data?: any) => void;
  }
}

export type ISNS = {
  _id?: string;
  sns_id?: string;
  sns_type: string;
  status: number;
}

export type ILog = {
  _id: string;
  type: string;
  group: string;
  content: string;
  createdAt: Date;
}

/**
 * 用在 style 上覆写组件库的 CSS 变量（antd 的 `--ant-*`、antd-mobile 的 `--adm-*`）。
 *
 * 运行时本来就合法：React 对**以 `--` 开头**的 key 走 `style.setProperty(name, value)`，
 * 既不驼峰转换、也不补 px（见 react-dom 的 setValueForStyles）。
 * 只是 `React.CSSProperties` 没有自定义属性的索引签名，裸写会报 TS2353，
 * 所以这里补一个索引签名，用 `as IStyleVars` 收掉报错（比逐行 `@ts-ignore` 好，注释不会跑偏）。
 *
 * ⚠️ 值只做 `String(value)`，**不会补单位**：`0` 没问题（长度允许无单位 0），
 * 但 `{ '--x': 10 }` 会写成 `--x: 10`（非法长度）→ 用到它的属性整体失效，要写 `'10px'`。
 */
export type IStyleVars = CSSProperties & Record<`--${string}`, string | number>
