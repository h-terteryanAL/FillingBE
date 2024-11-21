export interface IResponseMessage {
  message: string;
}

type UserResponseMsgKeys =
  | 'accountCreated'
  | 'notFound'
  | 'changed'
  | 'deleted'
  | 'alreadyExist'
  | 'created';

export const userResponseMsgs: Record<UserResponseMsgKeys, string> = {
  accountCreated: 'Account successfully created',
  notFound: 'User Not Found',
  created: 'User successfully created',
  changed: 'User data has been changed',
  deleted: 'User successfully deleted',
  alreadyExist: 'User with that email is already exist',
};
