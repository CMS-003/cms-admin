export type IProject = {
  _id?: string;
  title?: string;
  name?: string;
  cover?: string;
  desc?: string;
  available?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: number;
  user_id?: string;
}