<<<<<<< HEAD
import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup',
 standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA] // السطر ده مهم جداً
=======
import { Component } from '@angular/core';

@Component({
  selector: 'app-signup',
  imports: [],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
>>>>>>> 762c4c4769f95ce6c5c401bc650818b17f94d6d6
})
export class SignupComponent {

}
