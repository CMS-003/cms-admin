import { IComponent } from "./component"

export * from "./user"
export * from "./menu"
export * from "./component"
export * from "./project"
export * from "./resource"
export * from "./table"

declare global {
  interface Window {
    goto: (url: string) => void;
    sendCustomEvent: (view_id: string, name: string, data?: any) => void;
  }
}

export type IPageInfo = {
  path: string,
  param: { [key: string]: string },
  query: { [key: string]: string },
}

export type ITemplate = {
  _id: string;
  project_id: string;
  title: string;
  name: string;
  desc: string;
  cover: string;
  type: string;
  path: string;
  attrs: object;
  style: object;
  available: boolean;
  order: number;
  children: IComponent[]
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
