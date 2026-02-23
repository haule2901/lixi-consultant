import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { PrizeItem } from '../types';
import { ExternalLink } from 'lucide-react';

interface Props {
    prize: PrizeItem;
    userName: string;
}

export const PrizeModal: React.FC<Props> = ({ prize, userName }) => {
    useEffect(() => {
        // Fire confetti on mount
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults, particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults, particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    const UTM_PARAMS = '?utm_source=lixi-consultant&utm_medium=campaign&utm_campaign=consultant2026';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-[400px] w-[90vw] aspect-[2/3] mx-auto rounded-xl shadow-2xl relative z-50 mt-4 overflow-hidden flex flex-col items-center justify-center pb-20 px-6"
            style={{
                backgroundImage: "url('/envelope-back.png')",
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >

            <p className="text-red-900 text-lg font-bold mb-2 text-center drop-shadow-sm" style={{ fontFamily: 'serif' }}>
                Chúc mừng {userName} nhe!
            </p>

            <div className="flex flex-col items-center w-full">
                <p className="text-red-900 text-sm mb-1 text-center max-w-[95%] font-bold leading-relaxed">
                    {prize.message}
                </p>
                {prize.amount && (
                    <p className="text-4xl text-yellow-600 font-black mb-3 drop-shadow-md tracking-tight">
                        {prize.amount}
                    </p>
                )}
                <p className="text-red-800 text-xs italic mb-8 text-center font-medium">
                    Email xác nhận sẽ được gửi tới bạn trong ít phút nữa.
                </p>
            </div>

            <div className="w-full flex flex-col gap-2 relative z-10 w-full max-w-[95%]">
                <p className="text-red-900 text-[11px] font-bold text-center mb-1 leading-snug">
                    👉 Đăng ký tư vấn 1 trong 3 khoá học bên dưới để xài bao lì xì nha!
                </p>
                <button
                    onClick={() => window.open(`https://www.ayp.vn/intentional-eating${UTM_PARAMS}`, '_blank')}
                    className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-3 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex flex-col items-start justify-center text-xs text-left"
                >
                    <div className="flex w-full justify-between items-center mb-0.5">
                        <span>Khóa Intentional Eating</span> <ExternalLink size={14} />
                    </div>
                    <span className="text-[10px] font-normal opacity-90">Ăn uống, năng lượng, vóc dáng.</span>
                </button>
                <button
                    onClick={() => window.open(`https://www.ayp.vn/khoa-hoc-ky-nang-high-influence-public-speaking${UTM_PARAMS}`, '_blank')}
                    className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-3 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex flex-col items-start justify-center text-xs text-left"
                >
                    <div className="flex w-full justify-between items-center mb-0.5">
                        <span>Public Speaking</span> <ExternalLink size={14} />
                    </div>
                    <span className="text-[10px] font-normal opacity-90">Giao tiếp, thuyết trình.</span>
                </button>
                <button
                    onClick={() => window.open(`https://www.ayp.vn/khoa-hoc-ky-nang-the-underground-leader${UTM_PARAMS}`, '_blank')}
                    className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-3 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex flex-col items-start justify-center text-xs text-left"
                >
                    <div className="flex w-full justify-between items-center mb-0.5">
                        <span>The Underground Leader</span> <ExternalLink size={14} />
                    </div>
                    <span className="text-[10px] font-normal opacity-90">Giao tiếp cho quản lý.</span>
                </button>
            </div>
        </motion.div>
    );
};
