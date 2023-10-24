import { CachedStorageService } from './cached/cached.service';
import { GlobalStorageService } from './global-storage/global-storage.service';
import { LocalStorageService } from './local/local-storage.service';
import { SyncStorageService } from './sync/sync.service';


export { ISyncInfo, ISyncStorageValue } from './sync/sync.models';

export const storage = {
  global: GlobalStorageService,
  cached: CachedStorageService,
  sync: SyncStorageService,
  local: LocalStorageService,
};
