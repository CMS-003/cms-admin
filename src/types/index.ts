import { DraggableAttributes } from "@dnd-kit/core"
import { IComponent, IPageInfo } from "./component"
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities"
import { MouseEventHandler } from "react"

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
  handle: {
    listeners: any;
    attributes: any;
  };
  isDragging: boolean;
}
export type IBaseCom = {
  self: IComponent;
  bindings: IBindings;
  mode: 'edit' | 'preview';
  page: IPageInfo;
  children: any;
};