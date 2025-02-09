export type ITable = {
  _id?: string;
  name: string;
  fields: { id: string; name: string }[];
}
export type IJsonSchema = {
  title?: string;
  type: string;
  format?: string;
  enum?: any;
  const?: any;
  comment: string;
  default?: any;
  properties: { [key: string]: IJsonSchema };
  items?: IJsonSchema[];
  required?: string[];
  oneOf?: { type: string }[];
}
export type ITableDetail = {
  name: string;
  title: string;
  visible: number;
  forms: { _id: string; name: string }[];
  lists: { _id: string; name: string }[];
}
export type ITableWidget = {
  _id: string;
  widget: string;
  field: string;
  label: string;
  source: string;
  value: any;
  refer: any;
  explain: string;
  template: string;
  style: object | null;
  onclick?: string;
  onChange?: Function;
  widgets: ITableWidget[];
}
export type ITableView = {
  _id: string;
  name: string;
  type: string;
  table: string;
  url: string;
  order: number;
  widgets: ITableWidget[];
  data?: any;
}