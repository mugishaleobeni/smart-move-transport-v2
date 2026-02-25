import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function NavProgressBar() {
    const location = useLocation();
    const [isAnimating, setIsAnimating] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setIsAnimating(true);
        setProgress(30);

        const timer = setTimeout(() => {
            setProgress(100);
            const finishTimer = setTimeout(() => {
                setIsAnimating(false);
                setProgress(0);
            }, 300);
            return () => clearTimeout(finishTimer);
        }, 400);

        return () => {
            clearTimeout(timer);
        };
    }, [location.pathname]);

    return (
        <AnimatePresence>
            {isAnimating && (
                <motion.div
                    initial={{ width: '0%', opacity: 1 }}
                    animate={{ width: `${progress}%`, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="fixed top-0 left-0 h-[3px] bg-primary z-[9999] shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                    style={{
                        background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                        boxShadow: '0 0 10px #3b82f6, 0 0 5px #60a5fa'
                    }}
                />
            )}
        </AnimatePresence>
    );
}
