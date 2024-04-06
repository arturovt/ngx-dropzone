import {
  ApplicationConfig,
  ɵprovideZonelessChangeDetection,
} from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [ɵprovideZonelessChangeDetection()],
};
