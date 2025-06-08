import { storage } from '#imports';

const loadState = async () => {
    try {
        const state = await storage.getItem('local:state');
        return state || undefined;
    } catch (err) {
        console.error('Could not load state from storage:', err);
        return undefined;
    }
};

export const saveState = async (state) => {
    try {
        await storage.setItem('local:state', state);
    } catch (err) {
        console.error('Could not save state to storage:', err);
    }
};

export default loadState;