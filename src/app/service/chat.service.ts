import { Injectable, signal, computed, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ChatSession, Message, Doctor, ChatConfig } from '../models/chat.model';
import { GEMINI_CONFIG, DEFAULT_DOCTOR } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private chatsSignal = signal<ChatSession[]>([]);
  private activeChatIdSignal = signal<string | null>(null);
  private isLoadingSignal = signal(false);
  private isBrowser: boolean;

  readonly chats = computed(() => this.chatsSignal());
  readonly activeChatId = computed(() => this.activeChatIdSignal());
  readonly isLoading = computed(() => this.isLoadingSignal());

  readonly activeChat = computed(() => {
    const activeId = this.activeChatIdSignal();
    if (!activeId) return null;
    return this.chatsSignal().find(chat => chat.id === activeId) || null;
  });

  readonly activeMessages = computed(() => {
    const chat = this.activeChat();
    return chat ? chat.messages : [];
  });

  readonly unreadTotal = computed(() => {
    return this.chatsSignal().reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
  });

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.loadChatsFromStorage();
    } else {
      this.initializeDefaultChats();
    }
  }

  loadChatsFromStorage(): void {
    if (!this.isBrowser) return;
    
    const stored = localStorage.getItem('chats');
    if (stored) {
      const parsed = JSON.parse(stored);
      const chats = parsed.map((chat: any) => ({
        ...chat,
        lastMessageTime: chat.lastMessageTime ? new Date(chat.lastMessageTime) : undefined,
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined
        }))
      }));

      const isOldSetup = chats.some((c: any) => c.doctorName.includes('Mitchell') || c.doctorName.includes('Chen'));
      if (isOldSetup) {
        this.initializeDefaultChats();
      } else {
        this.chatsSignal.set(chats);
      }
    } else {
      this.initializeDefaultChats();
    }
  }

  private initializeDefaultChats(): void {
    const defaultChats: ChatSession[] = [
      {
        id: 'chat-1',
        doctorId: DEFAULT_DOCTOR.id,
        doctorName: DEFAULT_DOCTOR.name,
        doctorAvatar: GEMINI_CONFIG.robotAvatar,
        doctorSpecialty: DEFAULT_DOCTOR.specialty,
        isOnline: DEFAULT_DOCTOR.isOnline,
        lastMessage: "Hello! I am your AI medical assistant.",
        lastMessageTime: new Date(),
        unreadCount: 0,
        messages: [
          {
            id: 'msg-1',
            role: 'model',
            parts: [{ text: "أهلاً بك في ريفا الطبية (RIVA). أنا مساعدك الطبي الذكي، جاهز أسمعك وأساعدك بخصوص أي تعب أو استشارة طبية شاغلة بالك. طمني، حاسس بإيه دلوقتي؟" }],
            timestamp: new Date()
          }
        ]
      }
    ];

    this.chatsSignal.set(defaultChats);
    this.setActiveChat(defaultChats[0].id);
    this.saveToStorage();
  }

  setActiveChat(chatId: string): void {
    this.activeChatIdSignal.set(chatId);
    this.chatsSignal.update(chats =>
      chats.map(chat =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    );
    this.saveToStorage();
  }

  addMessage(chatId: string, message: Message): void {
    const newMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: new Date()
    };

    this.chatsSignal.update(chats =>
      chats.map(chat => {
        if (chat.id === chatId) {
          const lastText = message.parts.find(p => p.text)?.text || (message.parts.some(p => p.inlineData) ? '🖼️ Image' : '...');
          return {
            ...chat,
            messages: [...chat.messages, newMessage],
            lastMessage: lastText,
            lastMessageTime: new Date()
          };
        }
        return chat;
      })
    );

    if (this.activeChatIdSignal() === chatId) {
      this.saveToStorage();
    }
  }

  addMessageToActiveChat(message: Message): void {
    const activeId = this.activeChatIdSignal();
    if (activeId) {
      this.addMessage(activeId, message);
    }
  }

  updateLastMessage(chatId: string, message: Message): void {
    const newMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: new Date()
    };

    this.chatsSignal.update(chats =>
      chats.map(chat => {
        if (chat.id === chatId) {
          const lastText = message.parts.find(p => p.text)?.text || (message.parts.some(p => p.inlineData) ? '🖼️ Image' : '...');
          return {
            ...chat,
            messages: [...chat.messages, newMessage],
            lastMessage: lastText,
            lastMessageTime: new Date()
          };
        }
        return chat;
      })
    );

    this.saveToStorage();
  }

  createNewChat(doctor?: any): string {
    const targetDoctor = doctor || DEFAULT_DOCTOR;
    const avatar = targetDoctor.avatar || GEMINI_CONFIG.robotAvatar;

    const newChat: ChatSession = {
      id: `chat-${Date.now()}`,
      doctorId: targetDoctor.id,
      doctorName: targetDoctor.name,
      doctorAvatar: avatar,
      doctorSpecialty: targetDoctor.specialty,
      isOnline: true,
      systemInstruction: targetDoctor.prompt || GEMINI_CONFIG.systemInstruction,
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'model',
          parts: [{ text: `أهلاً بك، أنا دكتور ريفا المتخصص في ${targetDoctor.specialty}. أنا هنا مخصوص عشان أقدملك الدعم والنصيحة الطبية اللي محتاجها في التخصص ده بكل دقة ورعاية. ممكن تشرحلي إيه اللي تعبك أو إيه سؤالك؟ وألف سلامة عليك مقدماً.` }],
          timestamp: new Date()
        }
      ],
      unreadCount: 0,
      lastMessage: "New chat started",
      lastMessageTime: new Date()
    };

    this.chatsSignal.update(chats => [newChat, ...chats]);
    this.setActiveChat(newChat.id);
    this.saveToStorage();
    return newChat.id;
  }

  deleteChat(chatId: string): void {
    this.chatsSignal.update(chats => chats.filter(chat => chat.id !== chatId));
    if (this.activeChatIdSignal() === chatId) {
      this.activeChatIdSignal.set(null);
    }
    this.saveToStorage();
  }

  clearHistory(chatId: string): void {
    this.chatsSignal.update(chats =>
      chats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [chat.messages[0]],
            lastMessage: chat.messages[0].parts[0].text,
            lastMessageTime: new Date()
          };
        }
        return chat;
      })
    );
    this.saveToStorage();
  }

  searchChats(query: string): ChatSession[] {
    const lowerQuery = query.toLowerCase();
    return this.chatsSignal().filter(chat =>
      chat.doctorName.toLowerCase().includes(lowerQuery) ||
      chat.lastMessage?.toLowerCase().includes(lowerQuery) ||
      chat.doctorSpecialty.toLowerCase().includes(lowerQuery)
    );
  }

  private saveToStorage(): void {
    if (!this.isBrowser) return;
    localStorage.setItem('chats', JSON.stringify(this.chatsSignal()));
  }

  clearAllChats(): void {
    this.chatsSignal.set([]);
    this.activeChatIdSignal.set(null);
    if (this.isBrowser) {
      localStorage.removeItem('chats');
    }
  }

  async fetchChatsFromApi(userId: string): Promise<void> {
    this.isLoadingSignal.set(true);
    try {
      console.log('Fetching chats for user:', userId);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  updateDoctorOnlineStatus(doctorId: string, isOnline: boolean): void {
    this.chatsSignal.update(chats =>
      chats.map(chat =>
        chat.doctorId === doctorId ? { ...chat, isOnline } : chat
      )
    );
  }
}
