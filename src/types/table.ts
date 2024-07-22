export type ITable = {
  name: string;
  fields: { id: string; name: string }[];
}
export type ITableDetail = {
  name: string;
  forms: { id: string; name: string }[];
  lists: { id: string; name: string }[];
}
export type ITableView = {
  _id: string;
  name: string;
  type: string;
  table: string;
  order: number;
  widgets: { id: string; field: string; value: any; optionValue: any }[];
}