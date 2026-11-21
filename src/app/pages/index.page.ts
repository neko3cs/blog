import { Component } from '@angular/core';

import { HomeView } from '../home-view';

@Component({
  imports: [HomeView],
  template: `
    <main>
      @defer (hydrate never) {
        <app-home-view />
      }
    </main>
  `,
})
export default class HomePage {}
