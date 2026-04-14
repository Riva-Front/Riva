import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../../service/auth.service';
import { interval, Subscription, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

export interface Message {
  id?: number;
  sender: 'doctor' | 'patient';
  content: string;
  timestamp: string;
}

export interface ChatContact {
  id: number;
  name: string;
  avatar: string;
  lastMessage?: string;
  unread?: number;
  status: 'online' | 'offline';
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  // ── Role ──────────────────────────────────────────────────
  userRole: 'patient' | 'doctor' = 'patient';
  get isDoctor(): boolean { return this.userRole === 'doctor'; }
  sidebarLinks: { icon: string; route: string }[] = [];

  // ── Contacts (للدكتور: مرضاه — للمريض: دكتوره) ───────────
  contacts: ChatContact[] = [];
  selectedContact: ChatContact | null = null;
  isLoadingContacts = true;

  // ── Messages ──────────────────────────────────────────────
  messages: Message[] = [];
  newMessage = '';
  isLoading = true;
  isSending = false;
  showTip = true;


  private pollingSubscription!: Subscription;
  private shouldScrollToBottom = false;

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    this.resolveRole();
    this.loadContacts();
  }

  // ── Role Detection ────────────────────────────────────────
  private resolveRole(): void {
    const fromStorage = localStorage.getItem('userRole') || localStorage.getItem('role') || '';
    try {
      for (const key of ['user','userData','authUser','currentUser']) {
        const str = localStorage.getItem(key);
        if (str) {
          const obj = JSON.parse(str);
          const r = obj?.role || obj?.type || '';
          if (r) { this.userRole = r.toLowerCase().includes('doctor') ? 'doctor' : 'patient'; return; }
        }
      }
    } catch {}
    this.userRole = fromStorage.toLowerCase().includes('doctor') ? 'doctor' : 'patient';
    this.setSidebar();
  }

  // ── Load Contacts ─────────────────────────────────────────
  loadContacts(): void {
    const token = this.authService.getToken();

    if (this.isDoctor) {
      // الدكتور يشوف مرضاه المقبولين
      this.loadDoctorPatients(token);
    } else {
      // المريض يشوف دكاترته المتابعين
      this.loadPatientDoctors(token);
    }
  }

  private loadDoctorPatients(token: string | null): void {
    const doctorId = this.getMyId();
    if (!doctorId) { this.isLoadingContacts = false; return; }

    this.http.get<any>(`http://localhost:8000/api/doctor-relationships/${doctorId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        const list = res.data || res.patients || res || [];
        const accepted = Array.isArray(list)
          ? list.filter((r: any) => r.status === 'accepted' || r.status === 'approved' || !r.status)
          : [];

        this.contacts = accepted.map((r: any) => ({
          id:     r.patient_id || r.user_id || r.id,
          name:   r.patient_name || `${r.patient?.first_name || r.user?.first_name || ''} ${r.patient?.last_name || r.user?.last_name || ''}`.trim() || 'Patient',
          avatar: r.patient?.profile_image || r.user?.profile_image
            || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.patient_name || 'P')}&background=F0F4FF&color=2D5BFF`,
          status: 'online' as const,
        }));

        this.isLoadingContacts = false;
        if (this.contacts.length > 0) this.selectContact(this.contacts[0]);
      },
      error: () => { this.isLoadingContacts = false; }
    });
  }

  private loadPatientDoctors(token: string | null): void {
    this.http.get<any>('http://localhost:8000/api/my-doctors', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        const list = res.data || res.doctors || res || [];
        this.contacts = (Array.isArray(list) ? list : []).map((d: any) => ({
          id:     d.id || d.doctor_id,
          name:   d.doctor_name || `${d.user?.first_name || ''} ${d.user?.last_name || ''}`.trim() || 'Doctor',
          avatar: d.user?.profile_image
            || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.doctor_name || 'Dr')}&background=E6F0FF&color=2D5BFF`,
          status: 'online' as const,
        }));
        this.isLoadingContacts = false;
        if (this.contacts.length > 0) this.selectContact(this.contacts[0]);
      },
      error: () => { this.isLoadingContacts = false; }
    });
  }

  // ── Select Contact & Load Messages ───────────────────────
  selectContact(contact: ChatContact): void {
    this.selectedContact = contact;
    this.messages = [];
    this.isLoading = true;
    this.pollingSubscription?.unsubscribe();
    this.loadMessages(contact.id);
    this.startPolling(contact.id);
  }

  private getApiUrl(contactId: number): string {
    return `http://localhost:8000/api/messages/${contactId}`;
  }

  loadMessages(contactId: number): void {
    const token = this.authService.getToken();
    this.http.get<Message[]>(this.getApiUrl(contactId), {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (msgs) => {
        this.messages = msgs || [];
        this.isLoading = false;
        this.shouldScrollToBottom = true;
      },
      error: () => { this.isLoading = false; }
    });
  }

  private startPolling(contactId: number): void {
    const token = this.authService.getToken();
    this.pollingSubscription = interval(5000).pipe(
      switchMap(() =>
        this.http.get<Message[]>(this.getApiUrl(contactId), {
          headers: { Authorization: `Bearer ${token}` }
        }).pipe(catchError(() => of(this.messages)))
      )
    ).subscribe((msgs) => {
      if (msgs.length !== this.messages.length) {
        this.messages = msgs;
        this.shouldScrollToBottom = true;
      }
    });
  }

  // ── Send Message ──────────────────────────────────────────
  sendMessage(): void {
    const content = this.newMessage.trim();
    if (!content || !this.selectedContact) return;

    const sender = this.isDoctor ? 'doctor' : 'patient';
    const newMsg: Message = { sender, content, timestamp: new Date().toISOString() };

    this.messages = [...this.messages, newMsg];
    this.newMessage = '';
    this.isSending = true;
    this.shouldScrollToBottom = true;

    const token = this.authService.getToken();
    this.http.post<Message>(this.getApiUrl(this.selectedContact.id), { sender, content }, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (saved) => {
        const idx = this.messages.indexOf(newMsg);
        if (idx !== -1 && saved) {
          const updated = [...this.messages];
          updated[idx] = saved;
          this.messages = updated;
        }
        this.isSending = false;
      },
      error: () => { this.isSending = false; }
    });
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
  }

  formatTime(ts: string): string {
    try { return new Date(ts).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }); }
    catch { return ''; }
  }

  getMyId(): number | null {
    try {
      for (const key of ['user','userData','authUser','currentUser']) {
        const str = localStorage.getItem(key);
        if (str) { const obj = JSON.parse(str); if (obj?.id) return obj.id; }
      }
    } catch {}
    return null;
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) { this.scrollToBottom(); this.shouldScrollToBottom = false; }
  }

  private scrollToBottom(): void {
    try { const el = this.messagesContainer?.nativeElement; if (el) el.scrollTop = el.scrollHeight; } catch {}
  }
  
  // ── Role detection ────────────────────────────────────────
 
 private setSidebar(): void {   if (this.isDoctor) {
      this.sidebarLinks = [
        { icon: 'fas fa-home', route: '/dashboard' },
        { icon: 'fa-solid fa-circle-user', route: '/myprofile' },
        { icon: 'fa-solid fa-phone', route: '/contact' },
        { icon: 'fa-brands fa-rocketchat', route: '/chat' },
       
      ];
    } else {
      this.sidebarLinks = [
        { icon: 'fa-home', route: '/dashboard-p' },
        { icon: 'fa-pills', route: '/add-new-medication' },
        { icon: 'fa-user-doctor', route: '/doctor-cards' },
        { icon: 'fa-brands fa-rocketchat', route: '/chat' },
        { icon: 'fa-circle-user', route: '/myprofile' },
      ];
    }
  }
  ngOnDestroy(): void { this.pollingSubscription?.unsubscribe(); }
}