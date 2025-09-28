export type IResource = {
  [x: string]: any;
  _id: string;
  title: string;
  status: number;
  cover?: string;
  poster?: string;
  thumbnail?: string;
}