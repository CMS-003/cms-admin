
export type IUser = {
  id: string;
  account: string;
  avatar: string;
  nickname: string;
}

export type IVerification = {
  _id: string;
  method: string;
  type: number;
  code: string;
  content: string;
  user_id: string;
  receiver: string;
  createdAt: Date;
  expiredAt: Date;
  status: number;
}