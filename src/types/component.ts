
export type Config = {
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

export type Component = {
  _id?: string;
  parent_id?: string;
  tree_id?: string;
  title?: string;
  name?: string;
  cover?: string;
  desc?: string;
  available?: string;
  createdAt?: Date;
  updatedAt?: Date;
  accepts?: string[];
  children?: Component[];
}

export type ComponentType = {
  _id: string;
  name: string;
  title: string;
}

export enum EditorComponent {
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
export type EditorField = {
  field: string;
  title: string;
  type: string;
  component: EditorComponent;
  defaultValue: string | boolean | number;
  autoFocus?: boolean;
  value: { value: string | number, name: string }[];
  fetch?: Function;
}