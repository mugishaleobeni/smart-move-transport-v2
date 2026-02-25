import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertCircle, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionConfirmationProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'destructive' | 'default';
    icon?: React.ReactNode;
}

export const ActionConfirmation = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = 'destructive',
    icon
}: ActionConfirmationProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{
                                opacity: 0,
                                scale: 0.3,
                                y: 100,
                                rotateX: 45
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                                rotateX: 0,
                                transition: {
                                    type: "spring",
                                    damping: 25,
                                    stiffness: 300
                                }
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0.1,
                                y: 300,
                                rotateX: -45,
                                transition: {
                                    duration: 0.4,
                                    ease: [0.32, 0, 0.67, 0] // Ease out cubic-like for genie feel
                                }
                            }}
                            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto border border-zinc-200 dark:border-zinc-800"
                        >
                            <div className="p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center mb-4",
                                        variant === 'destructive' ? "bg-rose-50 text-rose-500" : "bg-primary/10 text-primary"
                                    )}>
                                        {icon || (variant === 'destructive' ? <Trash2 className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />)}
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{title}</h3>
                                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{description}</p>

                                <div className="flex flex-col sm:flex-row gap-3 mt-10">
                                    <Button
                                        variant="ghost"
                                        onClick={onClose}
                                        className="flex-1 h-12 rounded-2xl font-bold bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all active:scale-95"
                                    >
                                        {cancelText}
                                    </Button>
                                    <Button
                                        variant={variant === 'destructive' ? 'destructive' : 'default'}
                                        onClick={() => {
                                            onConfirm();
                                            onClose();
                                        }}
                                        className={cn(
                                            "flex-1 h-12 rounded-2xl font-bold shadow-lg transition-all active:scale-95",
                                            variant === 'destructive' ? "shadow-rose-500/20" : "shadow-primary/20"
                                        )}
                                    >
                                        {confirmText}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

