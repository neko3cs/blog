import { Component } from '@angular/core';

import { AboutView } from '../about-view';

@Component({
  imports: [AboutView],
  template: `
    <main>
      @defer (hydrate never) {
        <app-about-view />
      }
    </main>
  `,
})
export default class AboutPage {}
