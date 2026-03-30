


import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {

  accountForm: FormGroup;
  passwordForm: FormGroup;

  constructor(private fb: FormBuilder) {
    // fb ==> form build
    this.accountForm = this.fb.group({
      firstName: ['Mohamed', Validators.required],
      lastName: ['Norriss', Validators.required],
      birthdate: ['11/08/1988', Validators.required],
      email: ['m.norriss@email.com', [Validators.required, Validators.email]],
      country: ['Egypt', Validators.required],
      phone: ['+20 123 456 7890'],
      address: ['1234 El-Tahrir Street', Validators.required]
    });
// password
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }
 

  ngOnInit(): void {
    // استرجاع البيانات من LocalStorage 
    const savedData = localStorage.getItem('userAccount');
    if (savedData) {
      this.accountForm.patchValue(JSON.parse(savedData));
    }
  }


  // (Save)
  onSave() {
    if (this.accountForm.valid) {
      localStorage.setItem('userAccount', JSON.stringify(this.accountForm.value));
      alert('The data was successfully saved in localStorage');

      this.accountForm.reset();
    } else {
      alert('Please make sure you fill in all the fields');
    }
  }

  // (Update/Load Data)
onUpdate() {
 
  const savedData = localStorage.getItem('userAccount');

  if (savedData) {
  
    const parsedData = JSON.parse(savedData);
    this.accountForm.patchValue(parsedData);
    
    alert('tThe date has been successfilly retrieved, you can now edit it');
  } else {
    alert('sorry, there is no saved data to update.!');
  }
}


onSavePassword() {
    if (this.passwordForm.valid) {
      const passData = this.passwordForm.value;
      
      // التأكد من تطابق الباسورد الجديد
      if (passData.newPassword !== passData.confirmPassword) {
        alert('The new password does not match');
        return;
      }
      
      localStorage.setItem('userPassword', JSON.stringify(passData));
      alert('The password has been changed');
      this.passwordForm.reset();
    } else {
      alert('Please fill in all password files');
    }
    }

    onUpdatePassword() {
    const savedPass = localStorage.getItem('userPassword');
    if (savedPass) {
      const parsed = JSON.parse(savedPass);
      
      this.passwordForm.patchValue({
        currentPassword: parsed.newPassword 
      });
      alert('The current password has been recoverd');
    } else {
      alert('No password saved');
    }
  }
  onForgotPassword() {
    alert('A password reset link will be sent to your email address ' + this.accountForm.value.email);
  }
}