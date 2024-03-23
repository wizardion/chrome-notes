import { Plugin } from 'prosemirror-state';
import { TrackerView } from './helpers/tracker';
import { IEventListener } from 'core/components';


export function trackerChanges(listener: IEventListener): Plugin {
  return new Plugin({
    view() {
      return new TrackerView(listener);
    }
  });
}
