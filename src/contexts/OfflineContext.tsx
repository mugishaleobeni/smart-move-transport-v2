import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface QueuedAction {
    id: string;
    url: string;
    method: string;
    data: any;
    timestamp: number;
}

interface OfflineContextType {
    isOnline: boolean;
    queueLength: number;
    syncing: boolean;
    queueAction: (action: Omit<QueuedAction, 'id' | 'timestamp'>) => void;
    isBannerDismissed: boolean;
    setBannerDismissed: (dismissed: boolean) => void;
    syncQueue: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

const QUEUE_KEY = 'smart_move_offline_queue';

export function OfflineProvider({ children }: { children: React.ReactNode }) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [queue, setQueue] = useState<QueuedAction[]>([]);
    const [syncing, setSyncing] = useState(false);
    const [isBannerDismissed, setIsBannerDismissed] = useState(false);

    // Load queue from localStorage on mount
    useEffect(() => {
        const savedQueue = localStorage.getItem(QUEUE_KEY);
        if (savedQueue) {
            setQueue(JSON.parse(savedQueue));
        }
    }, []);

    // Sync queue to localStorage
    useEffect(() => {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }, [queue]);

    // Automatic Sync on Reconnection
    useEffect(() => {
        if (isOnline && queue.length > 0) {
            // Wait 3 seconds to ensure connection is stable before auto-sync
            const timer = setTimeout(() => {
                console.log('Online detected, auto-syncing queue...');
                syncQueue();
                setBannerDismissed(false); // Show status during sync
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, queue.length]);

    const queueAction = useCallback((action: Omit<QueuedAction, 'id' | 'timestamp'>) => {
        const newAction: QueuedAction = {
            ...action,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
        };
        setQueue((prev) => [...prev, newAction]);
        toast.info("Action saved offline. It will sync automatically when you're back online.", {
            description: `${action.method} ${action.url.split('/').pop()}`,
        });
    }, []);

    const syncQueue = useCallback(async () => {
        if (queue.length === 0 || syncing || !navigator.onLine) return;

        setSyncing(true);
        const toastId = toast.loading(`Uploading ${queue.length} updates...`);

        const updatedQueue = [...queue];
        const failedActions: QueuedAction[] = [];

        for (const action of updatedQueue) {
            try {
                // Ensure we are still online before each request
                if (!navigator.onLine) {
                    failedActions.push(action);
                    continue;
                }

                await api({
                    url: action.url,
                    method: action.method,
                    data: action.data,
                });
                console.log(`Successfully synced action: ${action.id}`);
            } catch (error) {
                console.error(`Failed to sync action: ${action.id}`, error);
                failedActions.push(action);
            }
        }

        setQueue(failedActions);
        setSyncing(false);
        toast.dismiss(toastId);

        if (failedActions.length === 0) {
            toast.success("System updated successfully!");
        } else if (failedActions.length < updatedQueue.length) {
            toast.error(`Partial success. ${failedActions.length} updates pending.`);
        }
    }, [queue, syncing]);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setIsBannerDismissed(false); // Reset dismissal on reconnect
            toast.success("Connected to system");
            // Automatic sync removed as requested
        };
        const handleOffline = () => {
            setIsOnline(false);
            setIsBannerDismissed(false); // Show banner when going offline
            toast.error("Entering offline mode");
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const handleOfflineAction = (e: Event) => {
            const customEvent = e as CustomEvent;
            queueAction(customEvent.detail);
        };
        window.addEventListener('smartmove_offline_action', handleOfflineAction);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('smartmove_offline_action', handleOfflineAction);
        };
    }, [queueAction]);

    return (
        <OfflineContext.Provider value={{
            isOnline,
            queueLength: queue.length,
            syncing,
            queueAction,
            isBannerDismissed,
            setBannerDismissed: setIsBannerDismissed,
            syncQueue // Exporting for manual trigger
        }}>
            {children}
        </OfflineContext.Provider>
    );
}

export function useOffline() {
    const context = useContext(OfflineContext);
    if (context === undefined) {
        throw new Error('useOffline must be used within an OfflineProvider');
    }
    return context;
}
