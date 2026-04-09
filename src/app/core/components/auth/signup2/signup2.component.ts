import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../service/auth.service';

@Component({
  selector: 'app-signup2',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup2.component.html',
  styleUrl: './signup2.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Signup2Component {

  profileImageUrl: string = 'https://ui-avatars.com/api/?name=User&background=E6F0FF&color=2D5BFF';
  selectedFile: File | null = null;
  hasCustomImage: boolean = false;

  gender: string = '';
  description: string = '';
  // المتغيرات الجديدة
  age: number | null = null;
  address: string = '';

  conditions = {
    diabetes: false,
    hypertension: false,
    cancer: false,
  };

  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  goBack(): void {
    this.router.navigate(['/signup']);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB. Please choose a smaller image.');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, PNG, or GIF files are allowed.');
        return;
      }

      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const base64 = e.target?.result as string;
        this.profileImageUrl = base64;
        this.hasCustomImage = true;

        localStorage.setItem('profileImage', base64);
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('profilePhotoInput') as HTMLInputElement;
    fileInput?.click();
  }

  clearImage(): void {
    this.profileImageUrl = 'https://ui-avatars.com/api/?name=User&background=E6F0FF&color=2D5BFF';
    this.selectedFile = null;
    this.hasCustomImage = false;

    localStorage.removeItem('profileImage');

    const fileInput = document.getElementById('profilePhotoInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  get selectedConditionsArray(): string[] {
    return Object.entries(this.conditions)
      .filter(([_, value]) => value)
      .map(([key]) => key);
  }

  get selectedConditionsText(): string {
    return this.selectedConditionsArray.join(', ');
  }

  onSubmit(): void {
    // تحديث التحقق ليشمل الحقول الجديدة إذا كانت مطلوبة
    if (!this.gender || !this.description.trim() || !this.age || !this.address.trim()) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const token = this.authService.getToken();

    const body = {
      gender: this.gender,
      about: this.description,
      medical_history: this.selectedConditionsText,
      age: this.age,       // إضافة العمر للـ Body
      address: this.address // إضافة العنوان للـ Body
    };

    console.log('SIGNUP2 BODY SENT:', body);

    fetch('http://localhost:8000/api/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          console.error('SERVER ERROR:', data);
          throw new Error(data.message || 'Server error: ' + res.status);
        }
        return data;
      })
      .then((data) => {
        console.log('SIGNUP2 RESPONSE:', data);
        this.successMessage = 'Profile updated successfully!';
        setTimeout(() => {
          this.router.navigate(['/signin']);
        }, 1000);
      })
      .catch((err) => {
        this.errorMessage = 'Something went wrong. Please try again.';
        console.error('Upload error:', err);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
}