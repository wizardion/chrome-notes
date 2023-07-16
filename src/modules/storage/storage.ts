import { CachedStorage } from './cached';
import { SyncStorage } from './sync';
import { LocalStorage } from './local';
import { GlobalStorage } from './global';


export default {
  global: GlobalStorage,
  cached: CachedStorage,
  sync: SyncStorage,
  local: LocalStorage,
};
