import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef,
  AfterViewChecked, CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectorRef, inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../../service/auth.service';
import { interval, Subscription, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface Message {
  id?: number;
  sender_id?: number;
  receiver_id?: number;
  body: string;
  created_at?: string;
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

  private cdr = inject(ChangeDetectorRef);

  userRole: 'patient' | 'doctor' = 'patient';
  get isDoctor(): boolean { return this.userRole === 'doctor'; }

  sidebarLinks: { icon: string; route: string }[] = [];
  myUserId: number | null = null;

  contacts: ChatContact[] = [];
  selectedContact: ChatContact | null = null;
  isLoadingContacts = true;

  messages: Message[] = [];
  newMessage = '';
  isLoading = false;
  isSending = false;
  showTip = true;

  private pollingSubscription!: Subscription;
  private shouldScrollToBottom = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.resolveRole();
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    const token = this.authService.getToken();
    this.http.get<any>('http://localhost:8000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        const user = res?.user || res;
        this.myUserId = user?.id || null;
        this.loadContacts();
      },
      error: () => {
        this.myUserId = this.getMyIdFromStorage();
        this.loadContacts();
      }
    });
  }

  goHome(): void { window.location.href = '/chat'; }

  private resolveRole(): void {
    try {
      for (const key of ['user', 'userData', 'authUser', 'currentUser']) {
        const str = localStorage.getItem(key);
        if (str) {
          const obj = JSON.parse(str);
          const r = obj?.role || obj?.type || obj?.user_type || '';
          if (r) {
            this.userRole = r.toLowerCase().includes('doctor') ? 'doctor' : 'patient';
            this.buildSidebar();
            return;
          }
        }
      }
    } catch {}
    const raw = localStorage.getItem('userRole') || localStorage.getItem('role') || '';
    this.userRole = raw.toLowerCase().includes('doctor') ? 'doctor' : 'patient';
    this.buildSidebar();
  }

  private buildSidebar(): void {
    this.sidebarLinks = this.isDoctor
      ? [
          { icon: 'fas fa-home', route: '/dashboard' },
          { icon: 'fa-brands fa-rocketchat', route: '/chat' },
          { icon: 'fa-solid fa-circle-user', route: '/myprofile' },
          { icon: 'fa-solid fa-phone', route: '/contact' },



        ]
      : [
          { icon: 'fas fa-home', route: '/dashboard-p' },
          { icon: 'fas fa-pills', route: '/add-new-medication' },
          { icon: 'fa-solid fa-user-doctor', route: '/doctor-cards' },
          { icon: 'fa-brands fa-rocketchat', route: '/chat' },
          { icon: 'fa-solid fa-circle-user', route: '/myprofile' },
        ];
  }

  loadContacts(): void {
    const token = this.authService.getToken();
    this.isLoadingContacts = true;
    this.isDoctor ? this.loadDoctorPatients(token) : this.loadPatientDoctors(token);
  }

  private loadDoctorPatients(token: string | null): void {
    this.http.get<any>('http://localhost:8000/api/doctor/patients', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        const arr = Array.isArray(res) ? res : (res.data || res.patients || []);
        const accepted = arr.filter((r: any) => r.status === 'active');
        const unique = accepted.filter((r: any, i: number, self: any[]) =>
          self.findIndex((x: any) => x.patient_id === r.patient_id) === i
        );
        this.contacts = unique.map((r: any) => {
          const user = r.patient?.user || {};
          const firstName = user.first_name || '';
          const lastName  = user.last_name  || '';
          const name = `${firstName} ${lastName}`.trim() || `Patient #${r.patient_id}`;
          return {
            id: user.id || r.patient_id,
            name,
            avatar: user.profile_image ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F0F4FF&color=2D5BFF`,
            status: 'online' as const,
          };
        });
        this.isLoadingContacts = false;
        if (this.contacts.length > 0) this.selectContact(this.contacts[0]);
      },
      error: (err) => {
        console.error('[Chat] doctor/patients failed:', err.status);
        this.isLoadingContacts = false;
      }
    });
  }

  private loadPatientDoctors(token: string | null): void {
    this.http.get<any>('http://localhost:8000/api/patient/my-doctors', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        const arr = Array.isArray(res) ? res : (res?.data || []);
        this.contacts = arr.map((d: any) => {
          const user = d.doctor?.user || {};
          const firstName = user.first_name || '';
          const lastName  = user.last_name  || '';
          const name = `${firstName} ${lastName}`.trim() || 'Doctor';
          return {
            id: user.id || d.doctor_id,
            name,
            avatar: user.profile_image ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E6F0FF&color=2D5BFF`,
            status: 'online' as const,
          };
        });
        this.isLoadingContacts = false;
        if (this.contacts.length > 0) this.selectContact(this.contacts[0]);
      },
      error: (err) => {
        console.error('[Chat] patient/my-doctors failed:', err.status);
        this.isLoadingContacts = false;
      }
    });
  }

  selectContact(contact: ChatContact): void {
    this.selectedContact = contact;
    this.messages = [];
    this.isLoading = true;
    this.pollingSubscription?.unsubscribe();
    setTimeout(() => {
      this.loadMessages(contact.id);
      this.startPolling(contact.id);
    }, 0);
  }

  private getApiUrl(contactId: number): string {
    return `http://localhost:8000/api/messages/${contactId}`;
  }

  loadMessages(contactId: number): void {
    const token = this.authService.getToken();
    this.http.get<any>(this.getApiUrl(contactId), {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        const msgs = Array.isArray(res) ? res : (res?.data || []);
        setTimeout(() => {
          this.messages = msgs;
          this.isLoading = false;
          this.shouldScrollToBottom = true;
        }, 0);
      },
      error: (err) => {
        console.error('[Chat] loadMessages error:', err.status);
        setTimeout(() => {
          this.isLoading = false;
          this.messages = [];
        }, 0);
      }
    });
  }

  private startPolling(contactId: number): void {
    this.pollingSubscription = interval(5000).pipe(
      switchMap(() => {
        const token = this.authService.getToken();
        return this.http.get<any>(this.getApiUrl(contactId), {
          headers: { Authorization: `Bearer ${token}` }
        }).pipe(catchError(() => of({ data: this.messages })));
      })
    ).subscribe((res) => {
      const msgs = Array.isArray(res) ? res : (res?.data || this.messages);
      const lastNewId = msgs[msgs.length - 1]?.id;
      const lastOldId = this.messages[this.messages.length - 1]?.id;
      if (lastNewId !== lastOldId) {
        this.messages = msgs;
        this.shouldScrollToBottom = true;
      }
    });
  }

  sendMessage(): void {
    const content = this.newMessage.trim();
    if (!content || !this.selectedContact) return;

    const newMsg: Message = {
      sender_id: this.myUserId ?? undefined,
      body: content,
      created_at: new Date().toISOString()
    };

    this.messages = [...this.messages, newMsg];
    this.newMessage = '';
    this.isSending = true;
    this.shouldScrollToBottom = true;

    const token = this.authService.getToken();
    this.http.post<any>(this.getApiUrl(this.selectedContact.id), { body: content }, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        const saved = res?.data || res;
        const idx = this.messages.indexOf(newMsg);
        if (idx !== -1 && saved?.id) {
          const updated = [...this.messages];
          updated[idx] = saved;
          this.messages = updated;
        }
        this.isSending = false;
        this.shouldScrollToBottom = true;
      },
      error: () => {
        this.isSending = false;
      }
    });
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
  }

  formatTime(ts: string): string {
    try { return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  }

  getMyIdFromStorage(): number | null {
    try {
      for (const key of ['user', 'userData', 'authUser', 'currentUser']) {
        const str = localStorage.getItem(key);
        if (str) { const obj = JSON.parse(str); if (obj?.id) return obj.id; }
      }
    } catch {}
    return null;
  }

  getMyId(): number | null { return this.myUserId; }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) { this.scrollToBottom(); this.shouldScrollToBottom = false; }
  }

  private scrollToBottom(): void {
    try { const el = this.messagesContainer?.nativeElement; if (el) el.scrollTop = el.scrollHeight; } catch {}
  }

  ngOnDestroy(): void { this.pollingSubscription?.unsubscribe(); }
}