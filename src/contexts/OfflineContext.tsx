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
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

const QUEUE_KEY = 'smart_move_offline_queue';

export function OfflineProvider({ children }: { children: React.ReactNode }) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [queue, setQueue] = useState<QueuedAction[]>([]);
    const [syncing, setSyncing] = useState(false);

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
        toast.loading(`Syncing ${queue.length} offline actions...`);

        const updatedQueue = [...queue];
        const failedActions: QueuedAction[] = [];

        for (const action of updatedQueue) {
            try {
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
        toast.dismiss();

        if (failedActions.length === 0) {
            toast.success("All actions synced successfully!");
        } else {
            toast.error(`Failed to sync ${failedActions.length} actions. Will retry later.`);
        }
    }, [queue, syncing]);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast.success("You're back online!");
            syncQueue();
        };
        const handleOffline = () => {
            setIsOnline(false);
            toast.error("You're offline. Changes will be saved locally.");
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const handleOfflineAction = (e: Event) => {
            const customEvent = e as CustomEvent;
            queueAction(customEvent.detail);
        };
        window.addEventListener('smartmove_offline_action', handleOfflineAction);

        // Initial sync attempt if online
        if (navigator.onLine) {
            syncQueue();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('smartmove_offline_action', handleOfflineAction);
        };
    }, [syncQueue]);

    return (
        <OfflineContext.Provider value={{ isOnline, queueLength: queue.length, syncing, queueAction }}>
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
