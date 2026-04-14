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

  // ── Doctor Info ───────────────────────────────────────────
  currentDoctor = {
    name: '',
    status: 'Online',
    avatar: ''
  };

  // ── Follow Requests (pending) ─────────────────────────────
  pendingRequests: any[] = [];
  isLoadingRequests = true;

  // ── Accepted Patients (followers) ────────────────────────
  patients: any[] = [];
  isLoadingPatients = true;

  // ── Stats ─────────────────────────────────────────────────
  stats = { total: 0, highRisk: 0, pdfs: 8, adherence: 92 };

  // ── Charts ────────────────────────────────────────────────
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
    this.loadPendingRequests();
    this.loadAcceptedPatients();
  }

  // ── Load Doctor Profile ───────────────────────────────────
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

  // ── Load Pending Follow Requests ──────────────────────────
  loadPendingRequests(): void {
    const token    = this.authService.getToken();
    const doctorId = this.getDoctorId();
    if (!doctorId) { this.isLoadingRequests = false; return; }

    this.http.get<any>(`http://localhost:8000/api/doctor-relationships/${doctorId}/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        const list = res.data || res.requests || res || [];
        this.pendingRequests = list.map((r: any) => ({
          id:          r.id,
          patientId:   r.patient_id || r.user_id || r.id,
          name:        r.patient_name
            || `${r.patient?.first_name || r.user?.first_name || ''} ${r.patient?.last_name || r.user?.last_name || ''}`.trim()
            || 'Patient',
          avatar:      r.patient?.profile_image || r.user?.profile_image
            || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.patient_name || 'P')}&background=F0F4FF&color=2D5BFF`,
          condition:   r.medical_history || r.condition || '—',
          requestedAt: r.created_at
            ? new Date(r.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
            : '',
          isProcessing: false,
        }));
        this.isLoadingRequests = false;
        console.log('[Dashboard] Pending requests:', this.pendingRequests);
      },
      error: (err) => {
        console.warn('[Dashboard] No pending endpoint, trying relationships:', err.status);
        // fallback: /api/doctor-relationships/{id}
        this.loadFromRelationships(doctorId, 'pending');
      }
    });
  }

  // ── Load Accepted Patients ────────────────────────────────
  loadAcceptedPatients(): void {
    const token    = this.authService.getToken();
    const doctorId = this.getDoctorId();
    if (!doctorId) { this.isLoadingPatients = false; return; }

    this.http.get<any>(`http://localhost:8000/api/doctor-relationships/${doctorId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        const list = res.data || res.patients || res || [];
        const accepted = Array.isArray(list)
          ? list.filter((r: any) => r.status === 'accepted' || r.status === 'approved' || !r.status)
          : [];

        this.patients = accepted.map((r: any) => ({
          id:        r.patient_id || r.user_id || r.id,
          name:      r.patient_name
            || `${r.patient?.first_name || r.user?.first_name || ''} ${r.patient?.last_name || r.user?.last_name || ''}`.trim()
            || 'Patient',
          img:       r.patient?.profile_image || r.user?.profile_image
            || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.patient_name || 'P')}&background=F0F4FF&color=2D5BFF`,
          condition: r.medical_history || r.condition || 'N/A',
          status:    r.health_status || 'Stable',
          room:      r.room || '—',
        }));

        this.stats.total = this.patients.length;
        this.isLoadingPatients = false;
        console.log('[Dashboard] Accepted patients:', this.patients);
      },
      error: (err) => {
        console.error('[Dashboard] Failed to load patients:', err);
        this.isLoadingPatients = false;
      }
    });
  }

  private loadFromRelationships(doctorId: number, status: string): void {
    const token = this.authService.getToken();
    this.http.get<any>(`http://localhost:8000/api/doctor-relationships/${doctorId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        const list = res.data || res || [];
        const filtered = Array.isArray(list)
          ? list.filter((r: any) => r.status === status || r.status === 'pending')
          : [];
        this.pendingRequests = filtered.map((r: any) => ({
          id:          r.id,
          patientId:   r.patient_id || r.user_id,
          name:        `${r.patient?.first_name || r.user?.first_name || ''} ${r.patient?.last_name || r.user?.last_name || ''}`.trim() || 'Patient',
          avatar:      r.patient?.profile_image || `https://ui-avatars.com/api/?name=P&background=F0F4FF&color=2D5BFF`,
          condition:   r.medical_history || '—',
          requestedAt: r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : '',
          isProcessing: false,
        }));
        this.isLoadingRequests = false;
      },
      error: () => { this.isLoadingRequests = false; }
    });
  }

  // ── Accept / Reject ───────────────────────────────────────
  acceptRequest(req: any): void {
    req.isProcessing = true;
    const token      = this.authService.getToken();
    const doctorId   = this.getDoctorId();

    this.http.post<any>(
      `http://localhost:8000/api/doctor-relationships/${doctorId}/accept`,
      { patient_id: req.patientId, relationship_id: req.id },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    ).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== req.id);
        this.loadAcceptedPatients();
        console.log('[Dashboard] Accepted:', req.name);
      },
      error: (err) => {
        req.isProcessing = false;
        console.error('[Dashboard] Accept failed:', err);
      }
    });
  }

  rejectRequest(req: any): void {
    req.isProcessing = true;
    const token      = this.authService.getToken();
    const doctorId   = this.getDoctorId();

    this.http.post<any>(
      `http://localhost:8000/api/doctor-relationships/${doctorId}/reject`,
      { patient_id: req.patientId, relationship_id: req.id },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    ).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== req.id);
        console.log('[Dashboard] Rejected:', req.name);
      },
      error: (err) => {
        req.isProcessing = false;
        console.error('[Dashboard] Reject failed:', err);
      }
    });
  }

  // ── Helper ────────────────────────────────────────────────
  private getDoctorId(): number | null {
    try {
      for (const key of ['user','userData','authUser','currentUser']) {
        const str = localStorage.getItem(key);
        if (str) {
          const obj = JSON.parse(str);
          if (obj?.role === 'doctor' || obj?.type === 'doctor') return obj.id || obj.doctor_id || null;
        }
      }
      // fallback: من الـ profile response المحفوظ
      const profile = localStorage.getItem('doctorProfile');
      if (profile) return JSON.parse(profile)?.id || null;
    } catch {}
    return null;
  }
}