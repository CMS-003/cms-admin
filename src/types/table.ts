export type ITable = {
  name: string;
  fields: { id: string; name: string }[];
}
export type IJsonSchema = {
  type?: string;
  format?: string;
  descrition?: string;
  enum?: any;
  comment?: string;
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
}
export type ITableView = {
  _id: string;
  name: string;
  type: string;
  table: string;
  order: number;
  widgets: ITableWidget[];
  data?: any;
}