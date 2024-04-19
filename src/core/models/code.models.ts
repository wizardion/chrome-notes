export type IDecorator<T = boolean> = () => Promise<T>;

export interface IAppConfig {
  applicationId?: number;
  delayedInterval: number;
  // pushWorker: string;
}
