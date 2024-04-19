export type IEventListener = (e?: Event) => void;

export interface IEventIntervals {
  intervals: {
    [key: string]: NodeJS.Timeout | null;
  };
  delay: number;
}
