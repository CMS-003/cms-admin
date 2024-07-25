export type ITable = {
  name: string;
  fields: { id: string; name: string }[];
}
export type ITableDetail = {
  name: string;
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