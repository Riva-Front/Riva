import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-add-new-medication',
  standalone: true,
  imports: [RouterModule],   // مهم علشان routerLink يشتغل
  templateUrl: './add-new-medication.component.html',
  styleUrls: ['./add-new-medication.component.css']

})
export class AddNewMedicationComponent {

}