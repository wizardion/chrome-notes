import { ILog, ILogLevel, ILogColor, ILogColors } from './models/logger.models';
import { load, logInfo, clear, configs, print } from './logger.module';


export class LoggerService {
  public static tracking: boolean;

  private name: string;
  private color: ILogColor;

  constructor(name: string, color?: ILogColors) {
    this.name = name;
    this.color = ILogColor[color];
  }

  public static get tracing(): boolean {
    return this.tracking;
  }

  public static set tracing(value: boolean) {
    configs.tracing = value;
    this.tracking = value;
  }

  public info(...args: any[]): Promise<void> {
    return logInfo(ILogLevel.Info, this.color, this.name, args);
  }

  public warn(...args: any[]): Promise<void> {
    return logInfo(ILogLevel.Warning, this.color, this.name, args);
  }

  public error(...args: any[]): Promise<void> {
    return logInfo(ILogLevel.Error, this.color, this.name, args);
  }

  public clear(): Promise<void> {
    return LoggerService.clear();
  }

  public addLine(): Promise<void> {
    return logInfo(ILogLevel.Info, null, this.name, null);
  }

  public static info(...args: any[]): Promise<void> {
    return logInfo(ILogLevel.Info, null, null, args);
  }

  public static warn(...args: any[]): Promise<void> {
    return logInfo(ILogLevel.Warning, null, null, args);
  }

  public static error(...args: any[]): Promise<void> {
    return logInfo(ILogLevel.Error, null, null, args);
  }

  public static clear(): Promise<void> {
    return clear();
  }

  public static print(log: ILog): void {
    print(log);
  }

  public static getAll(): Promise<ILog[]> {
    return load();
  }
}
