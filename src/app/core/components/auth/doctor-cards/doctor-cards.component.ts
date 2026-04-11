import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-doctor-cards',
  standalone: true,
  imports: [RouterModule, CommonModule, HttpClientModule],
  templateUrl: './doctor-cards.component.html',
  styleUrls: ['./doctor-cards.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DoctorCardsComponent implements OnInit {

  isLoading = true;
  errorMessage = '';
  doctors: any[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.http.get<any>('http://localhost:8000/api/doctors').subscribe({
      next: (data) => {
        console.log('API Response:', data);
        const doctorsArray = Array.isArray(data)
          ? data
          : data?.data || data?.doctors || [];
        this.doctors = doctorsArray.map((d: any) => this.normalizeDoctor(d));
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to load doctors';
        this.isLoading = false;
      }
    });
  }

  normalizeDoctor(d: any): any {
    return {
      ...d,
      name:
        d.user?.name ||
        d.user?.first_name ||
        d.name ||
        d.first_name ||
        d.full_name ||
        '',
      photo:
        d.user?.roleProfile ||
        d.user?.avatar ||
        d.photo ||
        d.image ||
        '',
      specialty: d.specialty || 'General',
      bio:
        d.about ||
        d.description ||
        d.bio ||
        d.notes ||
        'No description available'
    };
  }

  getDoctorName(d: any): string {
    return d.name?.trim() || 'Unknown Doctor';
  }

  getAvatarUrl(d: any): string {
    const localImage = localStorage.getItem('profileImage');
    const apiImage =
      d.user?.profile_image ||
      d.user?.avatar ||
      d.photo ||
      d.image;
    return localImage || apiImage || `https://ui-avatars.com/api/?name=${d.user_id || d.id}`;
  }

  getSpecialty(d: any): string {
    return d.specialty || 'General';
  }

  getBio(d: any): string {
    return d.bio || '';
  }

  getRating(doctor: any): string | null {
    const rating = Number(doctor?.rating);
    if (!rating || isNaN(rating)) return null;
    return rating.toFixed(1);
  }

  selectDoctor(doctor: any): void {
    localStorage.setItem('selectedDoctor', JSON.stringify(doctor));
    this.router.navigate(['/doctors-follow-request']);
  }
}