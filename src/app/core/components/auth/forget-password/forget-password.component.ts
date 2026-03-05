import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../../../../service/auth.service';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ForgetPasswordComponent {

  form!: FormGroup;
  message: string = '';
  loading: boolean = false;

  constructor(private fb: FormBuilder,
              private authService: AuthService) {}

  ngOnInit() {}

}
