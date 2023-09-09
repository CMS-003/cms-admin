
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
  _id?: string;
  parent_id: string;
  tree_id: string;
  title: string;
  name: string;
  type: string;
  cover: string;
  icon?: string;
  desc: string;
  available?: string;
  createdAt?: Date;
  updatedAt?: Date;
  children?: IComponent[];
}

export type IComponentType = {
  _id: string;
  name: string;
  title: string;
}

export enum IEditorComponent {
  Select = 'Select',
  Input = 'Input',
  Number = 'Number',
  Hidden= 'Hidden',
  Area= 'Area',
  Read= 'Read',
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