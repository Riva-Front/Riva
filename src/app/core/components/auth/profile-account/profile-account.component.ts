<<<<<<< HEAD
import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-account',
  standalone: true,
  imports: [CommonModule, FormsModule],  templateUrl: './profile-account.component.html',
  styleUrl: './profile-account.component.css',
     schemas: [CUSTOM_ELEMENTS_SCHEMA] 
=======
import { Component } from '@angular/core';

@Component({
  selector: 'app-profile-account',
  imports: [],
  templateUrl: './profile-account.component.html',
  styleUrl: './profile-account.component.css',
>>>>>>> 762c4c4769f95ce6c5c401bc650818b17f94d6d6
})
export class ProfileAccountComponent {

}
