import { IResource } from "./resource";

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
  widget: { field: string, value: string | number, type: 'boolean' | 'number' | 'string' | 'date', refer: { label: string, value: string | number }[], action: string, action_url: string, },

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
  swap: Function;
  swapResource: Function;
  toJSON: Function;
  pushRefer: Function;
  remRefer: Function;
}

export type IAuto = {
  self: IComponent;
  mode: string;
  children?: any;
  isDragging?: boolean;
  source?: any;
  setSource?: Function;
  setParentHovered?: Function;
  handler?: any
  page?: {
    path: string,
    param: { [key: string]: string },
    query: { [key: string]: string },
  };
  drag?: {
    isDragOver: boolean;
    isMouseOver: boolean;
    onDrop: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    onDragLeave: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    onDragOver: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    onContextMenu: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    setIsMouseOver: Function;
    get classNames(): string;
  }
}

export type IComponentType = {
  _id: string;
  name: string;
  group: string;
  title: string;
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
export type IWidget = {
  _id: string;
  title: string;
  cover: string;
  desc: string;
  order: number;
  status: number;
}