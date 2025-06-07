import { defineExtensionMessaging } from '@webext-core/messaging';

interface ProtocolMap {
    themeChanged: { theme: string };
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();