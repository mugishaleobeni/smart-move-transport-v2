import { useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOffline } from '@/contexts/OfflineContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function NetworkStatusIndicator() {
    const { isOnline, queueLength, syncing } = useOffline();

    return (
        <AnimatePresence>
            {(!isOnline || syncing || queueLength > 0) && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="fixed bottom-24 right-6 z-50 pointer-events-none"
                >
                    <div className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-2xl glass-strong border pointer-events-auto transition-colors duration-500",
                        isOnline ? "border-emerald-500/20" : "border-amber-500/20"
                    )}>
                        <div className={cn(
                            "p-2 rounded-xl transition-colors duration-500",
                            isOnline ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                        )}>
                            {isOnline ? (
                                syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />
                            ) : (
                                <WifiOff className="w-4 h-4" />
                            )}
                        </div>

                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-zinc-900 dark:text-white leading-none uppercase tracking-wider">
                                {isOnline ? (syncing ? 'Syncing...' : 'Live') : 'Browsing Offline'}
                            </span>
                            <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold mt-1 uppercase tracking-widest opacity-70">
                                {isOnline
                                    ? (queueLength > 0 ? `${queueLength} queued actions` : 'Everything is synced')
                                    : 'Viewing cached content'
                                }
                            </span>
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
            )}
        </AnimatePresence>
    );
}
