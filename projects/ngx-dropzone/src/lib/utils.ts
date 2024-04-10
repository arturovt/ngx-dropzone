import { inject, PLATFORM_ID } from '@angular/core';
import { fromEventPattern, Observable } from 'rxjs';

export function isPlatformBrowser() {
  return inject(PLATFORM_ID) === 'browser';
}

export function unpatchedFromEvent<T extends Event>(
  target: EventTarget,
  eventName: string,
  options?: EventListenerOptions | boolean
): Observable<T> {
  return fromEventPattern(
    (handler) => {
      const addEventListener =
        (<any>target).__zone_symbol__addEventListener ||
        target.addEventListener;

      addEventListener.call(target, eventName, handler, options);
    },
    (handler) => {
      const removeEventListener =
        (<any>target).__zone_symbol__removeEventListener ||
        target.removeEventListener;

      removeEventListener.call(target, eventName, handler, options);
    }
  );
}
