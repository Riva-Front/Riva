import { Component } from '@angular/core';
import { inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../../service/chat.service';
import { LanguageService } from '../../../../service/language.service';
import { ChatSession } from '../../../../models/chat.model';
import { DOCTOR_SPECIALTIES, DEFAULT_DOCTOR } from '../../../../constants';

@Component({
  selector: 'app-chat-list',
    standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.css',
})
export class ChatListComponent {
  
  private chatService = inject(ChatService);
  public langService = inject(LanguageService);
  t = this.langService.t;

  searchQuery = signal('');
  showDoctorPicker = signal(false);
  specialties = [DEFAULT_DOCTOR, ...DOCTOR_SPECIALTIES];
  
  chats = this.chatService.chats;
  activeChatId = this.chatService.activeChatId;

  displayedChats = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.chats();
    
    return this.chats().filter(chat =>
      chat.doctorName.toLowerCase().includes(query) ||
      chat.lastMessage?.toLowerCase().includes(query) ||
      chat.doctorSpecialty.toLowerCase().includes(query)
    );
  });

  selectChat(chatId: string): void {
    this.chatService.setActiveChat(chatId);
  }

  onSearch(): void {
  }

  toggleDoctorPicker(): void {
    this.showDoctorPicker.update(v => !v);
  }

  createNewSpecializedChat(spec: any): void {
    this.chatService.createNewChat(spec);
    this.showDoctorPicker.set(false);
    console.log('New specialized chat created:', spec.specialty);
  }

  onNewChat(): void {
    this.chatService.createNewChat();
    console.log('New chat created');
  }

  getTimeAgo(date?: Date): string {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return this.t().justNow;
    if (diffMins < 60) return `${diffMins} ${this.t().minutesAgo}`;
    if (diffHours < 24) return `${diffHours} ${this.t().hoursAgo}`;
    if (diffDays < 7) return `${diffDays} ${this.t().daysAgo}`;
    
    return date.toLocaleDateString();
  }


}
