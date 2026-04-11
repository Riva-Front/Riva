import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

interface Medication {
  id?: number;
  drug_name: string;
  dosage: string;
  schedule_time: string;
  frequency: string;
  notes: string;
}

@Component({
  selector: 'app-add-new-medication',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './add-new-medication.component.html',
  styleUrls: ['./add-new-medication.component.css']
})
export class AddNewMedicationComponent implements OnInit {

  private apiUrl = 'http://localhost:8000/api/medications';

  medications: Medication[] = [];
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  newMedication: Medication = {
    drug_name: '',
    dosage: '',
    schedule_time: '',
    frequency: 'daily',
    notes: ''
  };

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  ngOnInit(): void {
    this.loadMedications();
  }

  loadMedications(): void {
    this.isLoading = true;
    this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        console.log('GET response:', data);
        this.medications = Array.isArray(data) ? data : (data.results || data.data || data.medications || []);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading medications:', err);
        this.errorMessage = 'Failed to load medications.';
        this.isLoading = false;
      }
    });
  }

  saveMedication(): void {
    console.log('drug_name:', this.newMedication.drug_name);
    console.log('dosage:', this.newMedication.dosage);
    console.log('full object:', this.newMedication);

    if (!this.newMedication.drug_name || !this.newMedication.dosage) {
      this.errorMessage = 'Please fill in at least the medicine name and dosage.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const body = {
      drug_name: this.newMedication.drug_name,
      dosage: this.newMedication.dosage,
      frequency: this.newMedication.frequency,
      schedule_time: this.newMedication.schedule_time,
      notes: this.newMedication.notes
    };

    this.http.post<any>(this.apiUrl, body, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        console.log('POST response:', response);
        const created = response.data || response.medication || response;
        this.medications.push(created);
        this.successMessage = 'Medication saved successfully!';
        this.isSaving = false;
        this.resetForm();
      },
      error: (err) => {
        console.error('Error saving medication:', err);
        this.errorMessage = 'Failed to save medication. Please try again.';
        this.isSaving = false;
      }
    });
  }

  deleteMedication(id: number | undefined, index: number): void {
    if (!id) return;
    this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.medications.splice(index, 1);
      },
      error: (err) => {
        console.error('Error deleting medication:', err);
        this.errorMessage = 'Failed to delete medication.';
      }
    });
  }

  resetForm(): void {
    this.newMedication = {
      drug_name: '',
      dosage: '',
      schedule_time: '',
      frequency: 'daily',
      notes: ''
    };
  }
}