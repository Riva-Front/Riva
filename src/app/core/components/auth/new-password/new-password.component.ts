<<<<<<< HEAD
import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-new-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-password.component.html',
  styleUrl: './new-password.component.css',
   schemas: [CUSTOM_ELEMENTS_SCHEMA] // السطر ده مهم جداً
=======
import { Component } from '@angular/core';

@Component({
  selector: 'app-new-password',
  imports: [],
  templateUrl: './new-password.component.html',
  styleUrl: './new-password.component.css',
>>>>>>> 762c4c4769f95ce6c5c401bc650818b17f94d6d6
})
export class NewPasswordComponent {

}
