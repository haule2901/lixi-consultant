import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface Props {
    onCodeVerified: (code: string) => void;
}

export const CodeGate: React.FC<Props> = ({ onCodeVerified }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [checking, setChecking] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = code.trim().toUpperCase();
        if (trimmed.length !== 6) {
            setError('Mã bảo vệ phải có đúng 6 ký tự.');
            return;
        }

        setChecking(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase.rpc('validate_consultant_code', {
                p_code: trimmed,
            });

            if (rpcError) throw rpcError;

            const result = data?.[0];
            if (result?.valid) {
                onCodeVerified(trimmed);
            } else {
                setError('Mã không hợp lệ hoặc đã được sử dụng. Vui lòng liên hệ tư vấn viên để nhận mã mới.');
            }
        } catch (err) {
            console.error(err);
            setError('Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setChecking(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md w-full mx-auto bg-black/30 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/10 relative mt-14 md:mt-12"
        >
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-400/20 mb-4">
                    <ShieldCheck className="w-8 h-8 text-yellow-400" />
                </div>
                <h2
                    className="text-3xl md:text-4xl font-normal text-yellow-400 drop-shadow-md leading-tight tracking-wide mb-3"
                    style={{ fontFamily: '"Cherry Bomb One", cursive' }}
                >
                    Nhập Mã Bảo Vệ
                </h2>
                <p className="text-white/70 text-sm leading-relaxed">
                    Vui lòng nhập mã bảo vệ 6 ký tự mà tư vấn viên đã cung cấp cho bạn.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => {
                            const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                            setCode(val);
                            setError(null);
                        }}
                        className="w-full bg-white/20 border border-white/30 text-white placeholder-white/50 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all text-center text-2xl font-mono tracking-[0.5em] uppercase"
                        placeholder="• • • • • •"
                        maxLength={6}
                        autoFocus
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                <motion.button
                    whileHover={{ scale: checking ? 1 : 1.05 }}
                    whileTap={{ scale: checking ? 1 : 0.95 }}
                    type="submit"
                    disabled={checking || code.length !== 6}
                    className={`w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-red-900 font-bold text-lg py-4 rounded-xl shadow-[0_0_15px_rgba(250,204,21,0.5)] transition-all flex items-center justify-center gap-2 ${checking || code.length !== 6 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_0_25px_rgba(250,204,21,0.8)]'}`}
                >
                    {checking ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            ĐANG KIỂM TRA...
                        </>
                    ) : (
                        'XÁC NHẬN MÃ'
                    )}
                </motion.button>
            </form>

            <p className="text-white/40 text-xs text-center mt-6">
                Mỗi mã chỉ sử dụng được 1 lần duy nhất.
            </p>
        </motion.div>
    );
};
