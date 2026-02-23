import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { PrizeItem, UserInput } from '../types';

const PRIZE_LOOKUP: Record<string, PrizeItem> = {
    v_3m: { id: 'v_3m', type: 'VOUCHER', title: 'Voucher Khóa Học AYP', message: 'Chúc mừng bạn đã nhận được Voucher SIÊU ĐẶC BIỆT', amount: '3.000.000đ', weight: 1, stock: 1 },
    v_2m: { id: 'v_2m', type: 'VOUCHER', title: 'Voucher Khóa Học AYP', message: 'Chúc mừng bạn đã nhận được Voucher', amount: '2.000.000đ', weight: 3, stock: 3 },
    v_1m5: { id: 'v_1m5', type: 'VOUCHER', title: 'Voucher Khóa Học AYP', message: 'Chúc mừng bạn đã nhận được Voucher', amount: '1.500.000đ', weight: 5, stock: 5 },
    v_1m: { id: 'v_1m', type: 'VOUCHER', title: 'Voucher Khóa Học AYP', message: 'Chúc mừng bạn đã nhận được Voucher', amount: '1.000.000đ', weight: 8, stock: 8 },
    v_800k: { id: 'v_800k', type: 'VOUCHER', title: 'Voucher Khóa Học AYP', message: 'Chúc mừng bạn đã nhận được Voucher', amount: '800.000đ', weight: 12, stock: 12 },
    v_500k: { id: 'v_500k', type: 'VOUCHER', title: 'Voucher Khóa Học AYP', message: 'Chúc mừng bạn đã nhận được Voucher', amount: '500.000đ', weight: 71, stock: 71 },
};

interface Slot { slot_number: number; claimed_by: string | null; }
interface Props { leadId: string; user: UserInput; consultantCode: string; onSlotClaimed: (prize: PrizeItem) => void; }

export const EnvelopeContainer: React.FC<Props> = ({ leadId, user, consultantCode, onSlotClaimed }) => {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [claimingSlot, setClaimingSlot] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const audioCtx = useRef<AudioContext | null>(null);
    const lastTickPos = useRef(0);

    useEffect(() => { fetchSlots(); }, []);

    // Web Audio tick sound for scrolling
    const playTick = () => {
        try {
            if (!audioCtx.current) {
                audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioCtx.current.state === 'suspended') {
                audioCtx.current.resume();
            }
            const osc = audioCtx.current.createOscillator();
            const gain = audioCtx.current.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.current.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, audioCtx.current.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, audioCtx.current.currentTime + 0.05);
            gain.gain.setValueAtTime(0.05, audioCtx.current.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + 0.05);
            osc.start(audioCtx.current.currentTime);
            osc.stop(audioCtx.current.currentTime + 0.05);
        } catch (e) {
            // Ignored if browser blocks audio
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const currentPos = e.currentTarget.scrollLeft;
        if (Math.abs(currentPos - lastTickPos.current) > 200) {
            playTick();
            lastTickPos.current = currentPos;
        }
    };

    const scrollBy = (amount: number) => {
        if (scrollRef.current) {
            playTick();
            scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    const fetchSlots = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('lixi_consultant_slots')
            .select('slot_number, claimed_by')
            .order('slot_number');
        if (data) setSlots(data);
        setLoading(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft += e.deltaY * 1.5;
        }
    };

    const handleSelectSlot = async (slotNumber: number) => {
        if (claimingSlot) return;
        const slot = slots.find(s => s.slot_number === slotNumber);
        if (!slot || slot.claimed_by) return;

        setClaimingSlot(slotNumber);
        setErrorMsg(null);

        try {
            const { data, error } = await supabase.rpc('claim_consultant_slot', {
                p_slot_number: slotNumber,
                p_lead_id: leadId,
            });

            if (error) throw error;

            const result = data?.[0];
            if (result?.success) {
                const prize = PRIZE_LOOKUP[result.prize_id] || PRIZE_LOOKUP['v_500k'];

                // Mark the consultant code as used
                await supabase.rpc('mark_code_used', {
                    p_code: consultantCode,
                    p_lead_id: leadId,
                });

                const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
                if (webhookUrl) {
                    fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            full_name: user?.fullName,
                            phone: user?.phone,
                            email: user?.email,
                            concern: user?.concern,
                            lead_id: leadId,
                            slot_number: slotNumber,
                            prize_id: result.prize_id,
                            prize_type: prize.type,
                            prize_title: prize.title,
                            prize_amount: prize.amount || null,
                            consultant_code: consultantCode,
                            played_at: new Date().toISOString(),
                        }),
                    }).catch(() => { });
                }
                setTimeout(() => onSlotClaimed(prize), 700);
            } else {
                setClaimingSlot(null);
                setErrorMsg('Bao này vừa được người khác bốc! Chọn bao khác nhé 😊');
                await fetchSlots();
            }
        } catch (err) {
            console.error(err);
            setClaimingSlot(null);
            setErrorMsg('Có lỗi xảy ra, vui lòng thử lại.');
        }
    };

    const available = slots.filter(s => !s.claimed_by).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-yellow-300 text-xl animate-pulse">Đang xáo bài... 🧧</div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center pt-24 md:pt-28 pb-8">
            {/* Title */}
            <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-5xl font-bold text-yellow-400 mb-1 drop-shadow-lg text-center px-4"
                style={{ fontFamily: 'serif' }}
            >
                Chọn 1 Bao Lì Xì
            </motion.h2>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white/80 mb-3 text-sm"
            >
                🧧 Còn <strong className="text-yellow-300">{available}</strong> / 100 bao chưa được bốc
            </motion.p>

            {errorMsg && (
                <p className="text-red-300 text-sm mb-3 bg-red-500/20 px-4 py-2 rounded-xl mx-4 text-center">
                    {errorMsg}
                </p>
            )}

            {/* Hint */}
            <p className="text-white/40 text-xs mb-4 text-center">
                ← Kéo ngang để xem · Nhấn để chọn bao →
            </p>

            {/* Horizontal scroll carousel with buttons */}
            <div className="relative w-full max-w-[1400px] mx-auto flex items-center justify-center">

                {/* Left Button */}
                <button
                    onClick={() => scrollBy(-300)}
                    className="hidden md:flex absolute left-2 z-20 w-12 h-12 bg-black/50 hover:bg-black/70 border border-yellow-500/50 rounded-full items-center justify-center text-yellow-300 text-2xl backdrop-blur-sm transition shadow-[0_0_15px_rgba(250,204,21,0.3)] hover:scale-110"
                    aria-label="Cuộn trái"
                >
                    ‹
                </button>

                <div
                    ref={scrollRef}
                    onWheel={handleWheel}
                    onScroll={handleScroll}
                    className="w-full overflow-x-auto pb-4 pt-12 px-4 scroll-smooth"
                    style={{
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                        cursor: 'grab',
                    }}
                >
                    <div className="flex gap-4 md:gap-6 w-max px-4 md:px-12 items-center">
                        {slots.map((slot) => {
                            const isClaimed = !!slot.claimed_by;
                            const isClaiming = claimingSlot === slot.slot_number;

                            return (
                                <motion.div
                                    key={slot.slot_number}
                                    className="flex-shrink-0 relative"
                                    style={{
                                        width: 'clamp(240px, 23vw, 290px)'
                                    }}
                                    whileHover={!isClaimed ? { scale: 1.05, y: -10, zIndex: 50 } : {}}
                                    whileTap={!isClaimed ? { scale: 0.98 } : {}}
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    onClick={() => {
                                        if (!isClaimed) {
                                            playTick();
                                            handleSelectSlot(slot.slot_number);
                                        }
                                    }}
                                >
                                    <div className={`relative w-full rounded-2xl shadow-xl select-none
                                        ${isClaimed ? 'opacity-40 cursor-not-allowed' : isClaiming ? 'cursor-wait ring-4 ring-yellow-400 ring-offset-2 ring-offset-transparent' : 'cursor-pointer'}
                                    `}>
                                        {/* Envelope image */}
                                        <img
                                            src="/envelope-front.png"
                                            alt={`Bao lì xì số ${slot.slot_number}`}
                                            className={`w-full h-auto object-contain transition-all duration-300 drop-shadow-2xl ${isClaiming ? 'brightness-125' : ''} ${isClaimed ? 'grayscale' : ''}`}
                                            draggable={false}
                                        />

                                        {/* Number overlay */}
                                        {!isClaimed && (
                                            <div className="absolute top-[12%] left-0 right-0 flex flex-col items-center pointer-events-none">
                                                <span
                                                    className="font-black text-white drop-shadow-md"
                                                    style={{
                                                        fontSize: 'clamp(24px, 3.5vw, 42px)',
                                                        textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 0 5px rgba(250,204,21,0.5)',
                                                        fontFamily: 'serif',
                                                    }}
                                                >
                                                    {isClaiming ? '✨' : `#${slot.slot_number}`}
                                                </span>
                                            </div>
                                        )}

                                        {/* Claimed overlay */}
                                        {isClaimed && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl backdrop-blur-[1px]">
                                                <span className="text-5xl drop-shadow-lg opacity-80">🔒</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Button */}
                <button
                    onClick={() => scrollBy(300)}
                    className="hidden md:flex absolute right-2 z-20 w-12 h-12 bg-black/50 hover:bg-black/70 border border-yellow-500/50 rounded-full items-center justify-center text-yellow-300 text-2xl backdrop-blur-sm transition shadow-[0_0_15px_rgba(250,204,21,0.3)] hover:scale-110"
                    aria-label="Cuộn phải"
                >
                    ›
                </button>
            </div>
        </div>
    );
};
