import React from "react";
import { Shield, User, Lock } from "lucide-react";
import { LoginFormState } from "../../types";

interface LoginFormProps {
  loginForm: LoginFormState;
  loginErrors: Record<string, string>;
  onFormChange: (fields: Partial<LoginFormState>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  loginForm,
  loginErrors,
  onFormChange,
  onSubmit,
}) => {
  return (
    <div className="flex-1 flex justify-center items-center bg-dracl-bg dark:bg-drac-bg wavy-dots-bg p-4 md:p-12 overflow-y-auto overflow-hidden">
      {/* Animated Wavy Diagonal Notebook Dot Grid Background */}
      <div
        className="absolute inset-0 grid gap-0 p-4 overflow-hidden pointer-events-none select-none"
        style={{ gridTemplateColumns: "repeat(40, 1fr)", gridTemplateRows: "repeat(25, 1fr)" }}
      >
        {Array.from({ length: 1000 }).map((_, idx) => {
          const col = idx % 40;
          const row = Math.floor(idx / 40);
          return (
            <div key={idx} className="flex justify-center items-center w-full h-full">
              <div
                className="w-[1.5px] h-[1.5px] rounded-full bg-rosepine-iris/25 dark:bg-rosepine-iris/20 animate-dot-wave"
                style={{
                  animationDelay: `${(col + row) * 0.08}s`,
                  transformOrigin: "center"
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-md blunt-card shadow-[0_4px_30px_rgba(0,0,0,0.06)] bg-dracl-card dark:bg-drac-card flex flex-col pt-10 pb-8 px-6 md:px-8 z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-full bg-rosepine-iris/10 text-rosepine-iris mb-4">
            <Shield className="w-8 h-8" />
          </div>
        </div>

        {/* Form fields */}
        <form onSubmit={onSubmit} id="login-form" className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-dracl-muted dark:text-drac-comment mb-1.5 tracking-wider block">
              IDENTIFIANT DE CONNEXION
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pr-2 text-dracl-muted dark:text-drac-comment">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="NOM D'UTILISATEUR OU E-MAIL"
                id="login-username"
                value={loginForm.username}
                onChange={(e) => onFormChange({ username: e.target.value })}
                className="blunt-input pl-10"
              />
            </div>
            {loginErrors.username && (
              <span className="text-[9px] text-rosepine-love font-semibold uppercase block mt-1">
                ▲ {loginErrors.username}
              </span>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-dracl-muted dark:text-drac-comment mb-1.5 tracking-wider block">
              MOT DE PASSE
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pr-2 text-dracl-muted dark:text-drac-comment">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                id="login-password"
                value={loginForm.password}
                onChange={(e) => onFormChange({ password: e.target.value })}
                className="blunt-input pl-10"
              />
            </div>
            {loginErrors.password && (
              <span className="text-[9px] text-rosepine-love font-semibold uppercase block mt-1">
                ▲ {loginErrors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            className="w-full blunt-button blunt-button-primary py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_2px_8px_rgba(144,122,169,0.25)] hover:shadow-[0_4px_12px_rgba(144,122,169,0.35)]"
          >
            SE CONNECTER
          </button>
        </form>
      </div>
    </div>
  );
};
