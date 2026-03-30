import { Component, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./core/components/layout/navbar/navbar.component";
import { FooterComponent } from "./core/components/layout/footer/footer.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('project-riva');
 hideLayout = false;

  constructor(private router: Router, private route: ActivatedRoute) {

    this.router.events.subscribe(event => {

      if (event instanceof NavigationEnd) {

        let currentRoute = this.route.firstChild;

        while (currentRoute?.firstChild) {
          currentRoute = currentRoute.firstChild;
        }

        this.hideLayout = currentRoute?.snapshot.data['hideLayout'] || false;
      }

    });
  }
}
