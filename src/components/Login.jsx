import { useState } from "react";
// CORREÇÃO AQUI: Garante que sobe um nível para encontrar o ficheiro na raiz da src
import { supabase } from "../supabaseClient";
import FloatingLines from "./FloatingLines";

// Importação do teu logo a partir da pasta assets
import logoEugeen from "../assets/logo.png";

export default function Login({ aoEntrar }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  const lidarComSubmissao = async (e) => {
    e.preventDefault();
    setErro("");
    setMensagem("");
    setCarregando(true);

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErro("Credenciais inválidas ou utilizador não confirmado.");
        setCarregando(false);
      } else if (data.user) {
        aoEntrar();
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
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#090514] font-sans antialiased grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
      
      {/* LADO ESQUERDO: Ondas Dinâmicas e Identidade */}
      <div className="relative hidden lg:flex lg:col-span-7 xl:col-span-8 flex-col justify-between p-12 bg-gradient-to-b from-[#0a1128] to-[#040814] border-r border-white/5 overflow-hidden">
        {/* Fundo com as tuas ondas originais */}
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

        {/* Logo e Nome "Eugeen" no canto superior esquerdo */}
        <div className="relative z-10 flex items-center gap-3">
          <img
            src={logoEugeen}
            alt="Eugeen Logo"
            className="h-9 w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,150,255,0.3)]"
          />
          <span className="text-xl font-black text-white tracking-tight">
            Eugeen
          </span>
        </div>

        {/* Canto inferior esquerdo completamente limpo */}
        <div></div>
      </div>

      {/* LADO DIREITO: Formulário de Login */}
      <div className="col-span-1 lg:col-span-5 xl:col-span-4 bg-[#0d0b18] lg:bg-[#0f0d1e] flex flex-col items-center justify-center p-6 sm:p-12 border-l border-white/5 relative z-10">
        
        {/* Identidade visível apenas em Mobile (ecrãs pequenos) */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <img
            src={logoEugeen}
            alt="Eugeen Logo"
            className="h-14 w-auto object-contain mb-2"
          />
          <h1 className="text-xl font-bold text-white tracking-tight">Eugeen</h1>
        </div>

        {/* Contentor do Formulário */}
        <div className="w-full max-w-[360px] flex flex-col">
          <div className="mb-6 hidden lg:block">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isLogin ? "Bem-vindo de volta" : "Criar Acesso"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isLogin
                ? "Insira as suas credenciais para aceder ao portal das marcas."
                : "Crie a sua conta de acesso de administrador."}
            </p>
          </div>

          {/* Alertas de Erro e Sucesso */}
          {erro && (
            <div className="mb-4 text-center rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-400 border border-red-500/20 backdrop-blur-sm">
              {erro}
            </div>
          )}

          {mensagem && (
            <div className="mb-4 text-center rounded-xl bg-green-500/10 p-3 text-xs font-semibold text-green-400 border border-green-500/20 backdrop-blur-sm">
              {mensagem}
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={lidarComSubmissao} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 pl-1 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white placeholder-slate-500 outline-none focus:bg-white/10 focus:border-[#0096FF] transition-all font-medium"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 pl-1 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white placeholder-slate-500 outline-none focus:bg-white/10 focus:border-[#0096FF] transition-all font-medium"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-xl bg-gradient-to-r from-[#0084ff] to-[#2f4ba2] p-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.99] mt-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/10"
            >
              {carregando
                ? "A processar..."
                : isLogin
                  ? "Entrar na plataforma"
                  : "Registar Administrador"}
            </button>
          </form>

          {/* Divisor */}
          <div className="my-6 flex items-center justify-center gap-3">
            <div className="h-[1px] flex-1 bg-white/10"></div>
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">ou</span>
            <div className="h-[1px] flex-1 bg-white/10"></div>
          </div>

          {/* Botão Google */}
          <button
            type="button"
            onClick={loginComGoogle}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 shadow-sm cursor-pointer"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              className="w-4 h-4"
              alt="Google"
            />
            <span>Continuar com o Google</span>
          </button>

          {/* Alternador de Modo */}
          <p className="mt-6 text-center text-xs text-slate-400 font-medium">
            {isLogin ? (
              <>
                Não tens conta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setErro("");
                    setMensagem("");
                  }}
                  className="text-[#0096FF] font-bold hover:underline cursor-pointer bg-transparent border-none p-0 inline text-xs ml-0.5"
                >
                  Criar conta
                </button>
              </>
            ) : (
              <>
                Já fazes parte?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setErro("");
                    setMensagem("");
                  }}
                  className="text-[#0096FF] font-bold hover:underline cursor-pointer bg-transparent border-none p-0 inline text-xs ml-0.5"
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