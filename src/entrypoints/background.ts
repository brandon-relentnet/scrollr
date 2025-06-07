import { onMessage } from '../../messaging.ts';



export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });
  onMessage('getStringLength', message => {
    return message.data.length;
  });
});
