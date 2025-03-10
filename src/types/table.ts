export type ISchema = {
  _id?: string;
  name: string;
  title: string;
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