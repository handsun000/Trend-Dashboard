import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface KorailLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberNoInput: string;
  setMemberNoInput: (val: string) => void;
  passwordInput: string;
  setPasswordInput: (val: string) => void;
  isLoggingIn: boolean;
  onLogin: (e?: React.FormEvent, useDefault?: boolean) => void;
}

export const KorailLoginModal: React.FC<KorailLoginModalProps> = ({
  isOpen,
  onClose,
  memberNoInput,
  setMemberNoInput,
  passwordInput,
  setPasswordInput,
  isLoggingIn,
  onLogin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md p-6 rounded-3xl bg-[#0D152F] border border-white/10 shadow-2xl flex flex-col gap-4 text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              코레일 계정 연결 (Hot Sniper 세션)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          취소표 및 예매대기가 발생하는 즉시{' '}
          <span className="text-emerald-300 font-bold">지연시간 0초(0ms)</span>로
          티켓을 선점하기 위해 코레일 공식 모바일 세션을 메모리에 상주시킵니다.
        </p>

        <form onSubmit={(e) => onLogin(e, false)} className="flex flex-col gap-3 mt-2">
          <button
            type="button"
            disabled={isLoggingIn}
            onClick={() => onLogin(undefined, true)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 border border-cyan-400/30 disabled:opacity-50"
          >
            <span>🔑</span>
            <span>{isLoggingIn ? '연결 중...' : '비밀키 기본 계정으로 원클릭 연결 (Secret Key)'}</span>
          </button>

          <div className="flex items-center gap-2 my-1">
            <div className="h-[1px] flex-1 bg-white/10" />
            <span className="text-[10px] text-slate-500 font-mono">또는 직접 계정 입력</span>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-mono mb-1">
              코레일 회원번호 (10자리)
            </label>
            <input
              type="text"
              value={memberNoInput}
              onChange={(e) => setMemberNoInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-emerald-400"
              placeholder="미입력 시 비밀키(secret.yml) 기본 계정 사용"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-mono mb-1">
              비밀번호
            </label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
              placeholder="미입력 시 비밀키 기본값"
            />
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoggingIn ? '암호화 로그인 중...' : '입력한 계정으로 세션 연결'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default KorailLoginModal;
