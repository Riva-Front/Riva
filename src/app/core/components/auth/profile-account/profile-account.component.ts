import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-account',
  standalone: true,
  imports: [CommonModule, FormsModule],  templateUrl: './profile-account.component.html',
  styleUrl: './profile-account.component.css',
     schemas: [CUSTOM_ELEMENTS_SCHEMA] 

})
export class ProfileAccountComponent {  }