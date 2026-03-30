import { Component, OnInit, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common"; 
import { HttpClient, HttpClientModule } from "@angular/common/http";
import {
  ApexChart,
  ApexNonAxisChartSeries,
  ApexStroke,
  ApexXAxis,
  ChartComponent,
  NgApexchartsModule
} from 'ng-apexcharts';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, HttpClientModule],
})
export class DashboardComponent implements OnInit {

  // بيانات الإحصائيات (Cards)
  stats = {
    total: 142,
    highRisk: 12,
    pdfs: 8,
    adherence: 92
  };

  currentDoctor = {
    name: 'Kareim',
    status: 'Stable',
    avatar: 'image/avatar4.jpeg'
  };

  patients = [
    { name: 'Emma Wilson', condition: 'Heart Surgery', status: 'Critical', room: '205', img: 'https://i.pravatar.cc/150?u=1' },
    { name: 'James Rodriguez', condition: 'Diabetes', status: 'Attention', room: '312', img: 'https://i.pravatar.cc/150?u=2' },
    { name: 'Maria Garcia', condition: 'Post-Op Check', status: 'Stable', room: '108', img: 'https://i.pravatar.cc/150?u=3' }
  ];

  @ViewChild("chart") chart!: ChartComponent;

  // إعدادات الرسمة الدائرية (Pie Chart)
  public pieOptions = {
    series: [45, 25, 15, 15] as ApexNonAxisChartSeries,
    chart: {
      type: "donut" as const,
      height: 320
    } as ApexChart,
    labels: ["Diabetes", "Heart Disease", "Hypertension", "Other"],
    colors: ["#F2994A", "#27AE60", "#EB5757", "#2D9CDB"],
    legend: { position: 'bottom' as const },
    responsive: [{ breakpoint: 480, options: { chart: { width: 200 } } }]
  };

  // إعدادات الرسمة الخطية (Line Chart)
  public lineOptions = {
    series: [{ name: "Admissions", data: [30, 50, 20, 30, 25, 39, 60] }],
    chart: {
      type: "area" as const, // Area تعطي شكلاً جمالياً أكثر مثل الصورة
      height: 320,
      toolbar: { show: false }
    } as ApexChart,
    xaxis: {
      categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    } as ApexXAxis,
    stroke: {
      curve: "smooth" as const,
      width: 3
    } as ApexStroke,
    colors: ["#4F46E5"]
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    // جلب البيانات من الـ API وتحديث الرسوم
    this.http.get('YOUR_API_ENDPOINT').subscribe((data: any) => {
      this.pieOptions.series = [
        data.diabetesCount || 0,
        data.heartCount || 0,
        data.hyperCount || 0,
        data.otherCount || 0
      ];

      this.lineOptions.series = [{
        name: "Admissions",
        data: data.weeklyStats || [0, 0, 0, 0, 0, 0, 0]
      }];
    });
  }
}