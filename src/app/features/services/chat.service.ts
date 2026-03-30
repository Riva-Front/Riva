// import { Injectable } from '@angular/core';



// @Injectable({
//   providedIn: 'root',
// })
// export class ChatService {
  

// }


import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket;
  private url = 'http://localhost:3000'; // عنوان السيرفر بتاعك

  constructor() {
    this.socket = io(this.url);
  }

  // وظيفة لإرسال الرسالة
  sendMessage(message: string, sender: string) {
    this.socket.emit('newMessage', { text: message, user: sender });
  }

  // وظيفة لاستقبال الرسائل (Observable)
  getMessages(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('messageReceived', (data) => {
        observer.next(data);
      });
    });
  }
}