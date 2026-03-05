import { Wifi, WifiOff, RefreshCw, X, UploadCloud } from 'lucide-react';
import { useOffline } from '@/contexts/OfflineContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function NetworkStatusIndicator() {
    const { isOnline, queueLength, syncing, isBannerDismissed, setBannerDismissed, syncQueue } = useOffline() as any;

    return (
        <AnimatePresence>
            {(!isOnline || syncing || (isOnline && queueLength > 0)) && !isBannerDismissed && (
                <motion.div
                    initial={{ y: -60, x: '-50%', opacity: 0 }}
                    animate={{ y: 0, x: '-50%', opacity: 1 }}
                    exit={{ y: -60, x: '-50%', opacity: 0 }}
                    className="fixed top-4 left-1/2 z-[100] pointer-events-none w-auto max-w-[90vw]"
                >
                    <div className={cn(
                        "flex items-center gap-2.5 px-4 py-2 rounded-full shadow-lg glass-strong border pointer-events-auto transition-all duration-500",
                        isOnline ? "border-emerald-500/20" : "border-amber-500/20"
                    )}>
                        <div className={cn(
                            "flex items-center justify-center p-1.5 rounded-full",
                            isOnline ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                        )}>
                            {isOnline ? (
                                syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />
                            ) : (
                                <WifiOff className="w-3 h-3" />
                            )}
                        </div>

                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-zinc-900 dark:text-white leading-none uppercase tracking-tight">
                                {!isOnline ? 'No Network' : syncing ? 'Syncing...' : 'System Live'}
                            </span>
                            <span className="text-[8px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-tight opacity-80 whitespace-nowrap">
                                {!isOnline ? 'Browsing Offline' : queueLength > 0 ? `${queueLength} updates pending` : 'All synced'}
                            </span>
                        </div>

                        {(isOnline && queueLength > 0 && !syncing) && (
                            <>
                                <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-0.5" />
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        syncQueue();
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors group"
                                >
                                    <UploadCloud className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                    <span className="text-[9px] font-black uppercase">Sync Now</span>
                                </button>
                            </>
                        )}

                        <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

                        <button
                            onClick={() => setBannerDismissed(true)}
                            className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
