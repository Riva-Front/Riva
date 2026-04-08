import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../service/auth.service';

@Component({
  selector: 'app-signup2',
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

  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  // ✅ method للـ Back button
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

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, GIF, or PNG files are allowed.');
        return;
      }

      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.profileImageUrl = e.target?.result as string;
        this.hasCustomImage = true;
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
    const fileInput = document.getElementById('profilePhotoInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  onSubmit(): void {
    if (!this.gender || !this.description.trim()) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = new FormData();
    formData.append('gender', this.gender);
    formData.append('description', this.description);

    if (this.selectedFile) {
      formData.append('profile_image', this.selectedFile);
    }

    const token = this.authService.getToken();

    fetch('http://localhost:8000/api/profile/update', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
      .then((res) => {
        if (!res.ok) throw new Error('Server error: ' + res.status);
        return res.json();
      })
      .then((data) => {
        this.successMessage = 'Profile updated successfully!';
        console.log('Response:', data);
        this.router.navigate(['/signin']);
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