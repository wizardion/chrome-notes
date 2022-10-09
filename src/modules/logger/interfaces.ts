export type ILogColors = "red" | "green" | "blue";

export enum ILogType {
  Info = 0,
  Warning = 1,
  Error = 2
}

export enum ILogColor {
  red = '\x1b[31m%s\x1b[0m',
  green = '\x1b[32m%s\x1b[0m',
  blue = '\x1b[34m%s\x1b[0m'
}

export interface ILog {
  id?: number;
  name: string,
  color: string,
  time: number,
  type: ILogType,
  data: string;
}

export interface ILogCommand {
  item: ILog,
  action: string
}
