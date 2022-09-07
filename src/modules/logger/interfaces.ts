export interface ILog {
  id?: number;
  // order: number;
  data: string;
}

export interface ILogCommand {
  item: ILog,
  action: string
}
