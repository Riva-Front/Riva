import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-doctor-cards',
  standalone: true,
  imports: [RouterModule],   // مهم علشان routerLink يشتغل
  templateUrl: './doctor-cards.component.html',
  styleUrl: './doctor-cards.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA] // علشان spline-viewer

})
export class DoctorCardsComponent {

}
