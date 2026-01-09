import io from 'socket.io-client';
import { notification, Modal } from 'antd'
import events from './event'

export const ws = io(window.location.origin + '/ws', {
  path: '/ws',
  transports: ['websocket'],
  reconnectionAttempts: 3
});

ws.on('disconnect', () => {
  console.log('disconnected');
});
ws.on('message', (data: any) => {
  const key = `${data.module}-${data.name}`;
  console.log(data, 'ws')
  if (data.action === 'download') {
    const links = data.data;
    let timer = setInterval(() => {
      if (links.length) {
        let a = document.createElement('a');
        let url = links.pop();
        console.log(url);
        a.href = url; a.download = new URL(url).pathname.split('/').pop() || '';
        a.target = '_self'; a.click();
      } else {
        clearTimeout(timer);
      }
    }, 2100)
    return;
  }
  if (data.type === 'notify') {
    // module robot name uin action chat
    notification.info({ title: '提醒', message: data.data.message, description: `from ${data.name}` })
  } else if (data.type === 'system') {
    events.emit(data.module === 'qqBot' ? 'qqSystem' : 'other', { uin: data.name, action: data.action })
  } else if (data.type === 'modal') {
    Modal.info({ title: data.action, content: 'from: ' + data.name + ' ' + data.message })
  } else {
    events.emit('event', data);
  }
})

ws.on('open', () => {
  console.log('open');
})