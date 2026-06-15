import React, { useState, useEffect, FormEvent } from "react";
import { supabase } from "./supabaseClient";
import { Session } from "@supabase/supabase-js";
import FloatingLines from "./components/FloatingLines"; 
import Dashboard from "./components/Dashboard"; 

// @ts-ignore
import logoEugeen from "./assets/LOGO.png"; 

export default function App() {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [verificandoSessao, setVerificandoSessao] = useState<boolean>(true);

  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [erro, setErro] = useState<string>("");
  const [mensagem, setMensagem] = useState<string>("");
  const [carregando, setCarregando] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
      setVerificandoSessao(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const lidarComSubmissao = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro("");
    setMensagem("");
    setCarregando(true);

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErro("Credenciais inválidas ou utilizador não confirmado.");
        setCarregando(false);
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setErro(error.message);
      } else {
        setMensagem("Conta criada! Verifica o teu email para confirmar.");
      }
      setCarregando(false);
    }
  };

  const loginComGoogle = async () => {
    setErro("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: { prompt: "select_account" },
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      if (err instanceof Error) setErro(err.message);
    }
  };

  if (verificandoSessao) {
    return (
      <div className="min-h-screen w-full bg-[#0a0516] flex items-center justify-center">
        <span className="text-purple-400 text-sm font-semibold tracking-wider animate-pulse">A carregar...</span>
      </div>
    );
  }

  if (sessao) {
    return <Dashboard user={sessao.user} onSignOut={() => supabase.auth.signOut()} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row font-sans overflow-hidden bg-[#0a0516]">
      
      {/* SEÇÃO DA ESQUERDA: Linhas Fluídas */}
      <div className="relative flex-1 hidden md:flex flex-col justify-between p-12 overflow-hidden bg-[#06030d] border-r border-white/5">
        <div className="absolute inset-0 z-0 w-full h-full">
          <FloatingLines
            linesGradient={["#0096FF", "#2F4BA2", "#0A192F"]}
            enabledWaves={["top", "middle", "bottom"]}
            lineCount={12}
            lineDistance={6}
            animationSpeed={1.5}
            interactive={true}
            parallax={true}
            bendStrength={-3.5}
            bendRadius={5.0}
          />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <img src={logoEugeen as string} alt="Eugeen Logo" className="h-9 w-auto object-contain" />
          <span className="text-xl font-bold text-white tracking-wide bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Eugeen
          </span>
        </div>
        <div className="relative z-10"></div>
      </div>

      {/* SEÇÃO DA DIREITA: Caixa de Login DARK / TRANSPARENTE */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 bg-[#0a0516] relative">
        {/* Detalhe de luz de fundo difusa de design premium */}
        <div className="absolute w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="md:hidden flex flex-col items-center mb-8 z-10">
          <img src={logoEugeen as string} alt="Eugeen Logo" className="h-12 w-auto object-contain mb-2" />
          <h1 className="text-xl font-bold text-white tracking-wider">Eugeen</h1>
        </div>

        <div className="mb-6 w-full max-w-[400px] text-center">
          <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase">
            {isLogin ? "Sign In" : "Sign Up"}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {isLogin ? "Sign in with email address" : "Create your admin credentials"}
          </p>
        </div>

        {/* CONTAINER MODERNIZADO: Fundo escuro translúcido com efeito vidro */}
        <div className="w-full max-w-[400px] bg-[#120d24]/60 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] z-10">
          
          {erro && (
            <div className="mb-5 text-center rounded-xl bg-red-500/10 p-3 text-xs font-medium text-red-400 border border-red-500/20">
              {erro}
            </div>
          )}
          {mensagem && (
            <div className="mb-5 text-center rounded-xl bg-green-500/10 p-3 text-xs font-medium text-green-400 border border-green-500/20">
              {mensagem}
            </div>
          )}

          <form onSubmit={lidarComSubmissao} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 pl-1 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                className="w-full rounded-xl bg-white/[0.03] border border-white/10 p-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:bg-white/[0.05] transition-all"
                placeholder="yourname@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 pl-1 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-xl bg-white/[0.03] border border-white/10 p-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:bg-white/[0.05] transition-all"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-xl bg-purple-600 p-3.5 text-sm font-semibold text-white transition-all hover:bg-purple-500 active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-600/20 mt-2"
            >
              {carregando ? "A processar..." : isLogin ? "Entrar na Conta" : "Registar Admin"}
            </button>
          </form>

          <div className="my-6 flex items-center justify-center gap-3">
            <div className="h-[1px] flex-1 bg-white/10"></div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">ou</span>
            <div className="h-[1px] flex-1 bg-white/10"></div>
          </div>

          <button
            type="button"
            onClick={loginComGoogle}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-sm font-medium text-slate-200 transition-all hover:bg-white/[0.06] hover:border-white/20 shadow-sm cursor-pointer"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
            <span>Continuar com o Google</span>
          </button>

          <p className="mt-6 text-center text-xs text-slate-400 font-medium">
            {isLogin ? (
              <>
                Não tens conta?{" "}
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setErro(""); setMensagem(""); }}
                  className="text-purple-400 font-bold hover:text-purple-300 hover:underline cursor-pointer bg-transparent border-none p-0 inline text-xs ml-1"
                >
                  Criar conta
                </button>
              </>
            ) : (
              <>
                Já fazes parte?{" "}
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setErro(""); setMensagem(""); }}
                  className="text-purple-400 font-bold hover:text-purple-300 hover:underline cursor-pointer bg-transparent border-none p-0 inline text-xs ml-1"
                >
                  Iniciar Sessão
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}