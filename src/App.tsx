import { useState, useEffect } from 'react';
import { RegistrationForm } from './components/RegistrationForm';
import { EnvelopeContainer } from './components/EnvelopeContainer';
import { PrizeModal } from './components/PrizeModal';
import { CodeGate } from './components/CodeGate';
import { useLixiLogic } from './hooks/useLixiLogic';
import type { UserInput, PrizeItem } from './types';

type ScreenState = 'CODE_GATE' | 'REGISTRATION' | 'ENVELOPES' | 'RESULT';

function App() {
  const [screen, setScreen] = useState<ScreenState>('CODE_GATE');
  const [consultantCode, setConsultantCode] = useState<string | null>(null);
  const [user, setUser] = useState<UserInput | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [wonPrize, setWonPrize] = useState<PrizeItem | null>(null);

  const { remainingEnvelopes } = useLixiLogic();

  // Create falling flowers effect
  const [flowers, setFlowers] = useState<{ id: number; left: number; delay: number; duration: number; size: number; src: string }[]>([]);

  // 24h Countdown Timer Logic
  const [timeLeft, setTimeLeft] = useState<string>('24:00:00');

  // Check URL param for code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam && codeParam.length === 6) {
      // Auto-fill but still validate
      setConsultantCode(codeParam.toUpperCase());
    }
  }, []);

  useEffect(() => {
    let startTimeStr = localStorage.getItem('lixi_consultant_start_time_v1');
    if (!startTimeStr) {
      startTimeStr = Date.now().toString();
      localStorage.setItem('lixi_consultant_start_time_v1', startTimeStr);
    }

    const startTime = parseInt(startTimeStr, 10);
    const targetTime = startTime + 24 * 60 * 60 * 1000;

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        clearInterval(timer);
      } else {
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
        const minutes = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
        const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
        setTimeLeft(`${hours}:${minutes}:${seconds}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const newFlowers = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 15,
      duration: 12 + Math.random() * 15,
      size: 20 + Math.random() * 45,
      src: Math.random() > 0.5 ? '/hoa-mai.png' : '/hoa-dao.png'
    }));
    setFlowers(newFlowers);
  }, []);

  const handleCodeVerified = (code: string) => {
    setConsultantCode(code);
    setScreen('REGISTRATION');
  };

  const handleRegistrationSubmit = (data: UserInput, id: string) => {
    setUser(data);
    setLeadId(id);
    setScreen('ENVELOPES');
  };

  const handleSlotClaimed = (prize: PrizeItem) => {
    setWonPrize(prize);
    setScreen('RESULT');
  };

  return (
    <div className="min-h-screen bg-tet relative overflow-hidden flex flex-col items-center justify-center p-4">

      {/* AYP Logo - Top Left */}
      <a
        href="https://ayp.vn"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 left-4 md:top-6 md:left-6 z-50 hover:scale-105 transition-transform duration-300 drop-shadow-lg"
      >
        <img
          src="/logo-ayp-new.png"
          alt="AYP"
          className="h-8 md:h-12 w-auto object-contain opacity-90 drop-shadow-md"
        />
      </a>

      {/* Falling Apricot Flowers Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {flowers.map((f) => (
          <img
            key={f.id}
            src={f.src}
            alt="falling flower"
            className="absolute opacity-80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
            style={{
              width: `${f.size}px`,
              height: `${f.size}px`,
              left: `${f.left}%`,
              top: '-10%',
              animation: `fall ${f.duration}s linear infinite`,
              animationDelay: `${f.delay}s`,
            }}
          />
        ))}
        <style>{`
          @keyframes fall {
            0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
            10% { opacity: 0.9; }
            90% { opacity: 0.9; transform: translateY(110vh) rotate(270deg); }
            100% { transform: translateY(120vh) rotate(360deg); opacity: 0; }
          }
        `}</style>
      </div>

      {/* Global Header: Countdown and Tracker */}
      <div className="fixed bottom-4 left-0 w-full md:left-4 md:w-auto z-50 flex justify-center md:justify-start pb-2 md:pb-0 px-4 md:px-0 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 md:px-5 md:py-2 flex items-center gap-4 md:gap-5 shadow-2xl">
          <div className="flex flex-col items-center">
            <span className="text-yellow-200 text-xs md:text-[10px] font-medium uppercase tracking-wider mb-1 md:mb-0.5">Thời gian còn lại</span>
            <span className="text-white font-mono font-bold text-lg drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
              {timeLeft}
            </span>
          </div>
          <div className="w-[1px] h-10 md:h-8 bg-white/20"></div>
          <div className="flex flex-col items-center">
            <span className="text-yellow-200 text-xs md:text-[10px] font-medium uppercase tracking-wider mb-1 md:mb-0.5">Lì xì còn lại</span>
            <span className="text-white font-black text-lg drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] text-yellow-400">
              {remainingEnvelopes}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="z-10 w-full max-w-5xl mx-auto flex flex-col items-center justify-center relative min-h-[500px] pb-32 md:pb-12 mt-8 md:mt-4">
        {screen === 'CODE_GATE' && (
          <CodeGate onCodeVerified={handleCodeVerified} />
        )}

        {screen === 'REGISTRATION' && consultantCode && (
          <RegistrationForm consultantCode={consultantCode} onSubmit={handleRegistrationSubmit} />
        )}

        {screen === 'ENVELOPES' && leadId && user && consultantCode && (
          <EnvelopeContainer leadId={leadId} user={user} consultantCode={consultantCode} onSlotClaimed={handleSlotClaimed} />
        )}

        {screen === 'RESULT' && wonPrize && user && (
          <PrizeModal
            prize={wonPrize}
            userName={(user.fullName.trim().split(' ').pop() || user.fullName).charAt(0).toUpperCase() + (user.fullName.trim().split(' ').pop() || user.fullName).slice(1)}
          />
        )}
      </div>

    </div>
  );
}

export default App;
