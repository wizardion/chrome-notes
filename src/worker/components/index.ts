import { DataWorker } from './data-worker';
import { SyncWorker } from './sync-worker';


export { DataWorker } from './data-worker';
export { SyncWorker } from './sync-worker';
export { IWindow, StorageChange, AreaName } from './models';

export const workers: (DataWorker | SyncWorker)[] = [
  DataWorker,
  SyncWorker
];