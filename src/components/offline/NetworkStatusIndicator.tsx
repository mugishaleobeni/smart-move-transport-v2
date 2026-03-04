import { useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOffline } from '@/contexts/OfflineContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function NetworkStatusIndicator() {
    const { isOnline, queueLength, syncing } = useOffline();

    if (isOnline && queueLength === 0 && !syncing) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-20 right-6 z-50 pointer-events-none"
            >
                <div className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-2xl glass-strong border pointer-events-auto",
                    isOnline ? "border-emerald-500/20" : "border-rose-500/20"
                )}>
                    <div className={cn(
                        "p-2 rounded-xl",
                        isOnline ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                    )}>
                        {isOnline ? (
                            syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />
                        ) : (
                            <WifiOff className="w-4 h-4" />
                        )}
                    </div>

                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white leading-none">
                            {isOnline ? (syncing ? 'Syncing...' : 'Connected') : 'Offline Mode'}
                        </span>
                        {queueLength > 0 && (
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                                {queueLength} action{queueLength !== 1 ? 's' : ''} pending
                            </span>
                        )}
                    </div>

                    {syncing && (
                        <div className="w-12 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden ml-2">
                            <motion.div
                                className="h-full bg-emerald-500"
                                animate={{ x: [-48, 48] }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            />
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
