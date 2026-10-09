import { IComponent, IPageInfo, IWidget } from "./component"
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

export type IBindings = {
  root: {
    ref: (element: HTMLElement | null) => void;
    'data-node-id': string;
    'data-node-type': string;
    onContextMenu?: React.MouseEventHandler<HTMLDivElement>;
  };
  handleRef: (element: Element | null) => void;
  isDragging: boolean;
}
export type IBaseCom = {
  self: IComponent;
  bindings: IBindings;
  setNodeField: (node: ITemplate | IComponent, key: string, value: any) => void;
  source: any;
  setDataField: (widget: IWidget, value: any) => void;
  mode: 'edit' | 'preview';
  page: IPageInfo;
  children: any;
  [props: string]: any;
};

export type INode = {
  self: IComponent;
  source: any;
  setNodeField: (node: ITemplate | IComponent, key: string, value: any) => void;
  setDataField: (widget: IWidget, value: any) => void;
  onContextMenu?: React.MouseEventHandler<HTMLDivElement>;
  [props: string]: any;
}
