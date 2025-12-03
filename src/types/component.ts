import { DraggableProvided } from "react-beautiful-dnd";
import { type IComponent } from "@/store/component";
export { type IComponent };

export type IMode = 'edit' | 'preview'

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
  // 仅用于查询
  query: boolean;
  type: 'boolean' | 'number' | 'string' | 'json' | 'array';
  source: string;
  refer: {
    label: string;
    value: string | number | boolean;
  }[];
  action: string;
  method: string;
}

export type IAuto = {
  self: IComponent;
  parent?: IPageInfo;
  children?: any;
  query?: any;
  source: any;
  initField?: boolean;
  setDataField: (widget: IWidget, value: any) => void;
}
export type IBaseComponent = {
  mode:IMode;
  page:IPageInfo;
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
