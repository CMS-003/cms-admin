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
  title: string;
  name: string;
  type: string;
  cover: string;
  icon?: string;
  desc: string;
  order: number;
  status: number;
  createdAt?: Date;
  updatedAt?: Date;
  accepts?: string[];
  style?: any;
  attrs?: any;
  resources?: IResource[];

  children: IComponent[];
  data?: IResource[];
  $new?: boolean;
  $origin?: object;
  $selected?: boolean;
  diff: Function;
  setAttr: Function;
  setAttrs: Function;
  setStyle: Function;
  appendChild: Function;
  removeChild: Function;
  addResource: Function;
  remResource: Function;
  swap: Function;
  swapResource: Function;
  toJSON: Function;
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
  value: { value: string | number, name: string }[];
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