import { storage } from '#imports';
import debugLogger, { DEBUG_CATEGORIES } from './utils/debugLogger.js';

const loadState = async () => {
    try {
        const state = await storage.getItem('local:state');
        return state || undefined;
    } catch (err) {
        debugLogger.error(DEBUG_CATEGORIES.STORAGE, 'Could not load state from storage', err);
        return undefined;
    }
};

export const saveState = async (state) => {
    try {
        await storage.setItem('local:state', state);
    } catch (err) {
        debugLogger.error(DEBUG_CATEGORIES.STORAGE, 'Could not save state to storage', err);
    }
};

export default loadState;