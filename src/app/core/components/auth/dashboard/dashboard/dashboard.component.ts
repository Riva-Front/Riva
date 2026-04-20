import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { RouterModule } from "@angular/router";
import { AuthService } from '../../../../../service/auth.service';
import {
  ApexChart, ApexNonAxisChartSeries, ApexStroke, ApexXAxis,
  ChartComponent, NgApexchartsModule
} from 'ng-apexcharts';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, HttpClientModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardComponent implements OnInit {

  @ViewChild("chart") chart!: ChartComponent;

  currentDoctor = { name: '', status: 'Online', avatar: '' };

  pendingRequests: any[] = [];
  patients: any[]        = [];

  isLoadingRequests = true;
  isLoadingPatients = true;

  stats = { total: 0, highRisk: 0, pdfs: 8, adherence: 92 };

  public pieOptions = {
    series: [45, 25, 15, 15] as ApexNonAxisChartSeries,
    chart: { type: "donut" as const, height: 280 } as ApexChart,
    labels: ["Diabetes", "Heart Disease", "Hypertension", "Other"],
    colors: ["#F2994A", "#27AE60", "#EB5757", "#2D9CDB"],
    legend: { position: 'bottom' as const },
    responsive: [{ breakpoint: 480, options: { chart: { width: 200 } } }]
  };

  public lineOptions = {
    series: [{ name: "Patients", data: [30, 50, 20, 30, 25, 39, 60] }],
    chart: { type: "area" as const, height: 280, toolbar: { show: false } } as ApexChart,
    xaxis: { categories: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] } as ApexXAxis,
    stroke: { curve: "smooth" as const, width: 3 } as ApexStroke,
    colors: ["#4F46E5"]
  };

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadDoctorProfile();
    this.loadAllPatients();
  }

  loadDoctorProfile(): void {
    const token = this.authService.getToken();
    this.http.get<any>('http://localhost:8000/api/profile', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        const user = res.user || res;
        this.currentDoctor.name   = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Doctor';
        this.currentDoctor.avatar = user.profile_image
          || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentDoctor.name)}&background=E6F0FF&color=2D5BFF`;
      },
      error: () => {}
    });
  }

  // ✅ GET /api/doctor/patients — يجيب الكل ويقسمهم
  loadAllPatients(): void {
    const token = this.authService.getToken();

    this.http.get<any>('http://localhost:8000/api/doctor/patients', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        console.log('[Dashboard] raw response:', JSON.stringify(res, null, 2));

        // الـ API ممكن يرجع array مباشرة أو object فيه data
        const list = Array.isArray(res)
          ? res
          : (res.data || res.patients || res.relationships || []);

        const arr = Array.isArray(list) ? list : [];

        console.log('[Dashboard] total records:', arr.length);
        console.log('[Dashboard] statuses:', arr.map((r: any) => r.status));

        // pending → في انتظار الموافقة
        this.pendingRequests = arr
          .filter((r: any) => r.status === 'pending')
          .map((r: any) => this.mapToRequest(r));

        // ✅ الـ backend بيحفظ 'active' لما يقبل (مش 'accepted')
        // pending → لسه في الانتظار
        // active  → اتقبل
        // rejected / ended → مرفوض أو منتهي
        this.patients = arr
          .filter((r: any) => r.status === 'active')
          .map((r: any) => this.mapToPatient(r));

        this.stats.total       = this.patients.length;
        this.isLoadingRequests = false;
        this.isLoadingPatients = false;

        console.log('[Dashboard] pending:', this.pendingRequests.length, '| accepted:', this.patients.length);
      },
      error: (err) => {
        console.error('[Dashboard] failed:', err.status, err.error);
        this.isLoadingRequests = false;
        this.isLoadingPatients = false;
      }
    });
  }

  // ✅ POST /api/doctor-relationships/{relationship}/accept
  acceptRequest(req: any): void {
    req.isProcessing = true;
    const token = this.authService.getToken();

    this.http.post<any>(
      `http://localhost:8000/api/doctor-relationships/${req.id}/accept`,
      {},
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    ).subscribe({
      next: (res) => {
        console.log('[Dashboard] Accepted:', req.name, res);
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== req.id);
        this.loadAllPatients();
      },
      error: (err) => {
        req.isProcessing = false;
        console.error('[Dashboard] Accept failed:', err.status, err.error);
      }
    });
  }

  // ✅ POST /api/doctor-relationships/{relationship}/reject
  rejectRequest(req: any): void {
    req.isProcessing = true;
    const token = this.authService.getToken();

    this.http.post<any>(
      `http://localhost:8000/api/doctor-relationships/${req.id}/reject`,
      {},
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    ).subscribe({
      next: (res) => {
        console.log('[Dashboard] Rejected:', req.name, res);
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== req.id);
      },
      error: (err) => {
        req.isProcessing = false;
        console.error('[Dashboard] Reject failed:', err.status, err.error);
      }
    });
  }

  private mapToRequest(r: any): any {
    // الـ API بيرجع: relationship → patient → user
    const patientModel = r.patient || {};
    const userModel    = patientModel.user || r.user || {};

    console.log('[mapToRequest] r:', JSON.stringify(r, null, 2));

    const firstName = userModel.first_name || patientModel.first_name || '';
    const lastName  = userModel.last_name  || patientModel.last_name  || '';
    const name      = `${firstName} ${lastName}`.trim() || 'Patient';
    const avatar    = userModel.profile_image || patientModel.profile_image
      || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F0F4FF&color=2D5BFF`;

    return {
      id:           r.id,
      patientId:    r.patient_id || patientModel.id,
      name,
      avatar,
      condition:    r.notes || patientModel.medical_history || '—',
      requestedAt:  r.created_at
        ? new Date(r.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
        : '',
      isProcessing: false,
    };
  }

  private mapToPatient(r: any): any {
    const patientModel = r.patient || {};
    const userModel    = patientModel.user || r.user || {};

    const firstName = userModel.first_name || patientModel.first_name || '';
    const lastName  = userModel.last_name  || patientModel.last_name  || '';
    const name      = `${firstName} ${lastName}`.trim() || 'Patient';
    const avatar    = userModel.profile_image || patientModel.profile_image
      || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F0F4FF&color=2D5BFF`;

    return {
      id:        r.patient_id || patientModel.id,
      name,
      img:       avatar,
      condition: r.notes || patientModel.medical_history || 'N/A',
      status:    'Stable',
      room:      '—',
    };
  }
}