import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { UserInput } from '../types';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface Props {
    consultantCode: string;
    onSubmit: (data: UserInput, leadId: string) => void;
}

export const RegistrationForm: React.FC<Props> = ({ consultantCode, onSubmit }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<UserInput & { captchaAnswer: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [captchaA, setCaptchaA] = useState(0);
    const [captchaB, setCaptchaB] = useState(0);

    // Initialize CAPTCHA
    useEffect(() => {
        setCaptchaA(Math.floor(Math.random() * 9) + 1);
        setCaptchaB(Math.floor(Math.random() * 9) + 1);
    }, []);

    const handleFormSubmit = async (data: UserInput & { captchaAnswer: string }) => {
        setIsSubmitting(true);
        setSubmitError(null);

        // Validate CAPTCHA
        if (parseInt(data.captchaAnswer) !== captchaA + captchaB) {
            setSubmitError('Kết quả phép toán không chính xác. Vui lòng thử lại!');
            setCaptchaA(Math.floor(Math.random() * 9) + 1);
            setCaptchaB(Math.floor(Math.random() * 9) + 1);
            setIsSubmitting(false);
            return;
        }

        try {
            // Check if phone or email exists
            const { data: existingLeads, error } = await supabase
                .from('lixi_consultant_leads')
                .select('id')
                .or(`phone.eq.${data.phone},email.eq.${data.email}`)
                .limit(1);

            if (error) {
                console.error("Supabase Error:", error);
                throw error;
            }

            if (existingLeads && existingLeads.length > 0) {
                setSubmitError('Bạn đã hết lượt bốc lì xì (Số điện thoại hoặc Email này đã tham gia trước đó).');
                return;
            }

            // Insert lead
            const { data: lead, error: insertError } = await supabase
                .from('lixi_consultant_leads')
                .insert([{
                    full_name: data.fullName,
                    phone: data.phone,
                    email: data.email,
                    concern: data.concern,
                    consultant_code: consultantCode,
                }])
                .select('id')
                .single();

            if (insertError || !lead) {
                throw insertError || new Error('Could not create lead');
            }

            onSubmit(data, lead.id);
        } catch (err: any) {
            console.error(err);
            setSubmitError('Có lỗi xảy ra khi kiểm tra thông tin. Vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl w-full mx-auto bg-black/30 backdrop-blur-md p-6 lg:p-10 rounded-3xl shadow-2xl border border-white/10 relative flex flex-col gap-6 mt-14 md:mt-12"
        >
            {/* Anh Khuong image at top right overlapping */}
            <img
                src="/anh-khuong.png"
                alt="Anh Khương"
                className="absolute -top-12 -right-4 w-28 md:-top-10 md:-right-8 md:w-56 z-20 pointer-events-none drop-shadow-2xl"
            />

            {/* Full-width Header: Headline */}
            <div className="text-center relative z-10 pt-4 md:pt-0 pb-2">
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-normal text-yellow-400 drop-shadow-md leading-tight tracking-wide" style={{ fontFamily: '"Cherry Bomb One", cursive' }}>
                    Bạn quá tuổi nhận lì xì? <br />Ở đây có phát!
                </h2>
            </div>

            {/* Two equal-height columns */}
            <div className="flex flex-col md:flex-row gap-6 lg:gap-10 items-stretch relative z-10">

                {/* Left Column: Rules */}
                <div className="flex-1 bg-black/50 p-4 rounded-2xl border border-white/10 text-white text-xs space-y-3 shadow-inner overflow-y-auto">
                    <p className="font-bold text-yellow-300 text-sm flex items-center gap-2">
                        <span>🧧</span> Hướng dẫn và thể lệ:
                    </p>

                    <div className="space-y-0.5 text-white/90">
                        <p className="font-semibold text-yellow-200">1. Về số lượng bao lì xì</p>
                        <p>Sẽ có tổng <strong>100 bao lì xì</strong>, tất cả đều chứa Voucher giảm học phí khóa học — giá trị từ <strong>500.000đ đến 3.000.000đ</strong> (trong đó, chỉ có duy nhất <strong>1 bao lì xì trị giá 3.000.000đ</strong>).</p>
                    </div>

                    <div className="space-y-1 text-white/90">
                        <p className="font-semibold text-yellow-200">2. Một chút lưu ý nhỏ để cuộc vui trọn vẹn:</p>
                        <ul className="pl-3 list-disc space-y-0.5">
                            <li><strong>Dành cho ai:</strong> Chỉ dành cho những bạn đã được tư vấn viên cung cấp mã bảo vệ.</li>
                            <li><strong>Lượt tham gia:</strong> Mỗi bạn (1 SĐT &amp; 1 Email chính chủ) sẽ có <strong>01 lượt</strong> mở bao duy nhất.</li>
                            <li>Khi nhận được voucher, bạn sẽ nhận <strong>email xác nhận voucher</strong> trong vài phút.</li>
                        </ul>
                    </div>

                    <div className="space-y-1 text-white/90">
                        <p className="font-semibold text-yellow-200">3. Về Voucher của bạn:</p>
                        <ul className="pl-3 list-disc space-y-0.5">
                            <li>Dùng để đăng ký các khoá học của anh <strong>Huỳnh Duy Khương tại AYP</strong>, hạn dùng đến hết <strong>30/04/2026</strong>.</li>
                            <li>Không quy đổi thành tiền mặt hay chuyển nhượng.</li>
                            <li>Chính thức có giá trị khi bạn nhận được email từ: <span className="text-yellow-300">support.huynhduykhuong@ayp.vn</span>.</li>
                        </ul>
                    </div>

                    <p className="text-white/70 italic border-t border-white/10 pt-2">
                        🌟 Team xin chúc bạn một năm mới nhiều sức khoẻ, năng lượng để thực hiện những dự định mà bạn mong muốn nhé!
                    </p>
                </div>

                {/* Right Column: Form */}
                <div className="w-full md:w-[420px] flex-shrink-0 bg-black/20 p-6 rounded-2xl border border-white/10 relative backdrop-blur-sm flex flex-col">
                    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-yellow-200 mb-1">Họ và tên</label>
                            <input
                                {...register('fullName', { required: 'Vui lòng nhập họ tên' })}
                                className="w-full bg-white/20 border border-white/30 text-white placeholder-white/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                                placeholder="VD: Nguyễn Văn A"
                            />
                            {errors.fullName && <p className="text-yellow-300 text-xs mt-1">{errors.fullName.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-yellow-200 mb-1">Số điện thoại</label>
                            <input
                                {...register('phone', {
                                    required: 'Vui lòng nhập số điện thoại',
                                    pattern: { value: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ' }
                                })}
                                type="tel"
                                className="w-full bg-white/20 border border-white/30 text-white placeholder-white/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                                placeholder="VD: 0912345678"
                            />
                            {errors.phone && <p className="text-yellow-300 text-xs mt-1">{errors.phone.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-yellow-200 mb-1">Email</label>
                            <input
                                {...register('email', {
                                    required: 'Vui lòng nhập email',
                                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' }
                                })}
                                type="email"
                                className="w-full bg-white/20 border border-white/30 text-white placeholder-white/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                                placeholder="VD: email@example.com"
                            />
                            {errors.email && <p className="text-yellow-300 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <div className="pt-2">
                            <label className="block text-sm font-bold text-yellow-400 mb-3 leading-relaxed">Bạn đang ưu tiên khía cạnh nào nhất?</label>
                            <div className="space-y-2">
                                <label className="flex items-start gap-3 text-white/90 text-sm cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors border border-transparent hover:border-white/10">
                                    <input
                                        type="radio"
                                        value="Sức khoẻ, năng lượng, vóc dáng."
                                        {...register('concern', { required: 'Vui lòng chọn một ưu tiên' })}
                                        className="mt-1 flex-shrink-0"
                                    />
                                    <span className="leading-snug">Sức khoẻ, năng lượng, vóc dáng.</span>
                                </label>
                                <label className="flex items-start gap-3 text-white/90 text-sm cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors border border-transparent hover:border-white/10">
                                    <input
                                        type="radio"
                                        value="Kỹ năng thuyết trình, giao tiếp"
                                        {...register('concern')}
                                        className="mt-1 flex-shrink-0"
                                    />
                                    <span className="leading-snug">Kỹ năng thuyết trình, giao tiếp</span>
                                </label>
                                <label className="flex items-start gap-3 text-white/90 text-sm cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors border border-transparent hover:border-white/10">
                                    <input
                                        type="radio"
                                        value="Khả năng phối hợp giao tiếp với cấp trên, cấp dưới."
                                        {...register('concern')}
                                        className="mt-1 flex-shrink-0"
                                    />
                                    <span className="leading-snug">Khả năng phối hợp giao tiếp với cấp trên, cấp dưới.</span>
                                </label>
                            </div>
                            {errors.concern && <p className="text-yellow-300 text-xs mt-2">{errors.concern.message}</p>}
                        </div>

                        {/* Math CAPTCHA */}
                        <div>
                            <label className="block text-sm font-medium text-yellow-200 mb-1">
                                Xác thực chống spam: {captchaA} + {captchaB} = ?
                            </label>
                            <input
                                {...register('captchaAnswer', { required: 'Vui lòng nhập kết quả' })}
                                type="number"
                                className="w-full bg-white/20 border border-white/30 text-white placeholder-white/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-mono"
                                placeholder="Nhập kết quả phép cộng"
                            />
                            {errors.captchaAnswer && <p className="text-yellow-300 text-xs mt-1">{errors.captchaAnswer.message}</p>}
                        </div>

                        <div className="pt-2">
                            {submitError && (
                                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm font-medium text-center">
                                    {submitError}
                                </div>
                            )}
                            <motion.button
                                whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                                whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full mt-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-red-900 font-bold text-lg py-4 rounded-xl shadow-[0_0_15px_rgba(250,204,21,0.5)] transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-[0_0_25px_rgba(250,204,21,0.8)]'}`}
                            >
                                {isSubmitting ? 'ĐANG KIỂM TRA...' : 'NHẬN LÌ XÌ'}
                            </motion.button>
                        </div>
                    </form>
                </div>

            </div>{/* end two-column row */}
        </motion.div>
    );
};
