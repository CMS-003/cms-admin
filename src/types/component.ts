import { DraggableProvided } from "react-beautiful-dnd";
import { IResource } from "./resource";

export type IPageInfo = {
  template_id: string;
  path: string;
  param: { [key: string]: string };
  query: { [key: string]: string | number };
  setQuery: (field: string, value: number | string) => void;
  close: Function;
}

export type IConfig = {
  _id?: string;
  name?: string;
  cover?: string;
  desc?: string;
  available?: string;
  createdAt?: Date;
  updatedAt?: Date;
  type: string;
  data: any;
}

export type IWidget = {
  field: string,
  value: any;
  // body query
  in: string;
  type: 'boolean' | 'number' | 'string' | 'json';
  refer: {
    label: string;
    value: string | number | boolean;
  }[];
  action: string;
  action_url: string;
}

export type IComponent = {
  _id: string;
  parent_id: string;
  tree_id: string;
  template_id: string;
  title: string;
  name: string;
  type: string;
  cover: string;
  icon: string;
  desc: string;
  order: number;
  status: number;
  createdAt?: Date;
  updatedAt?: Date;
  accepts: string[];
  style: any;
  attrs: any;
  api: string;
  resources?: IResource[];
  queries: string[];
  widget: IWidget;

  children: IComponent[];
  data?: IResource[];
  $new?: boolean;
  $origin?: object;
  $selected?: boolean;
  diff: Function;
  setAttr: Function;
  setWidget: Function;
  changeWidgetType: Function;
  setAttrs: Function;
  updateStyle: Function;
  appendChild: Function;
  removeChild: Function;
  addResource: Function;
  remResource: Function;
  getApi: (id: string, query?: { [key: string]: any }) => string;
  swap: (srcIndex: number, dstIndex: number) => void;
  swapResource: Function;
  toJSON: Function;
  pushRefer: Function;
  remRefer: Function;
}

export type IAuto = {
  self: IComponent;
  mode: string;
  parent?: IPageInfo;
  children?: any;
  query?: any;
  source: any;
  setDataField: (widget: IWidget, value: any) => void;
  dnd?: {
    isDragging: boolean;
    ref: DraggableProvided['innerRef'];
    props: DraggableProvided['draggableProps'] | DraggableProvided['dragHandleProps'];
    style: DraggableProvided['draggableProps']['style'];
  };
  [key: string]: any;
}
export type IBaseComponent = {
  drag: {
    isDragOver: boolean;
    get className(): string;
    events: {
      onDrop?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
      onDragLeave?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
      onDragOver?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
      onMouseEnter?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
      onMouseOver?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
      onMouseLeave?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
      onContextMenu?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    }
  }
}

export type IComponentType = {
  _id: string;
  name: string;
  group: string;
  title: string;
  status: number;
  accepts: string[];
}

export enum IEditorComponent {
  Select = 'Select',
  Input = 'Input',
  Number = 'Number',
  Hidden = 'Hidden',
  Area = 'Area',
  Read = 'Read',
  Switch = 'Switch',
  RemoteSelect = 'RemoteSelect',
  Image = 'Image',
  Editor = 'Editor',
}
export type IEditorField = {
  field: string;
  title: string;
  type: string;
  component: IEditorComponent;
  defaultValue: string | boolean | number;
  autoFocus?: boolean;
  value: { value: string | number | boolean, name: string }[];
  fetch?: Function;
}
