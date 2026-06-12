import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import FloatingLines from "./components/FloatingLines"; // CORRIGIDO: Caminho correto para a pasta components
import Dashboard from "./components/Dashboard"; // Importa a tua página de gestão

// IMPORTA O TEU LOGO DA PASTA ASSETS
import logoEugeen from "./assets/logo.png"; // CORRIGIDO: Caminho correto para a pasta assets a partir da raiz src

export default function App() {
  // 1. ESTADO DE AUTENTICAÇÃO (Controla se mostra o Login ou a Gestão)
  const [sessao, setSessao] = useState(null);
  const [verificandoSessao, setVerificandoSessao] = useState(true);

  // 2. ESTADOS DO FORMULÁRIO DE LOGIN
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  // MONITORIZAR SESSÃO DO SUPABASE
  useEffect(() => {
    // Verifica se já existe um utilizador ligado ao abrir a app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
      setVerificandoSessao(false);
    });

    // Escuta em tempo real se o utilizador entra ou sai
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // FUNÇÃO DE SUBMISSÃO DO FORMULÁRIO
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
        // O onAuthStateChange vai detetar e mudar a página automaticamente aqui
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

  // LOGIN COM GOOGLE
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

  // Ecrã de carregamento inicial para evitar flash de ecrã branco
  if (verificandoSessao) {
    return (
      <div className="min-h-screen w-full bg-[#0a0516] flex items-center justify-center">
        <span className="text-white text-sm font-semibold tracking-wider">A carregar...</span>
      </div>
    );
  }

  // Se o utilizador tiver sessão activa, renderiza a Página de Gestão
  if (sessao) {
    return <Dashboard />;
  }

  // Se NÃO tiver sessão, renderiza o teu Layout de Login original
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row font-sans overflow-hidden bg-[#0a0516]">
      {/* SEÇÃO DA ESQUERDA: Fundo escuro com as tuas Ondas Azuis */}
      <div className="relative flex-1 hidden md:flex flex-col justify-between p-12 overflow-hidden bg-[#06030d]">
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
          <img
            src={logoEugeen}
            alt="Eugeen Logo"
            className="h-9 w-auto object-contain"
          />
          <span className="text-xl font-bold text-white tracking-wide">
            Eugeen
          </span>
        </div>

        <div className="relative z-10"></div>
      </div>

      {/* SEÇÃO DA DIREITA: Caixa de Login Centralizada */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 bg-[#0a0516] z-10">
        <div className="md:hidden flex flex-col items-center mb-6">
          <img
            src={logoEugeen}
            alt="Eugeen Logo"
            className="h-12 w-auto object-contain mb-2"
          />
          <h1 className="text-xl font-bold text-white">Eugeen</h1>
        </div>

        <div className="mb-6 w-full max-w-[380px] text-left md:text-center">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {isLogin ? "SIGN IN" : "SIGN UP"}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {isLogin
              ? "Sign in with email address"
              : "Create your admin credentials"}
          </p>
        </div>

        <div className="w-full max-w-[380px] bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-2xl">
          {erro && (
            <div className="mb-4 text-center rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200">
              {erro}
            </div>
          )}
          {mensagem && (
            <div className="mb-4 text-center rounded-xl bg-green-50 p-3 text-xs font-semibold text-green-600 border border-green-200">
              {mensagem}
            </div>
          )}

          <form onSubmit={lidarComSubmissao} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 pl-1">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-xl bg-gray-50 border-2 border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-black transition-all font-medium"
                placeholder="Yourname@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 pl-1">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-xl bg-gray-50 border-2 border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-black transition-all font-medium"
                placeholder="Introduz a tua password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-xl bg-[#121212] p-3 text-sm font-semibold text-white transition-all hover:bg-black mt-2 disabled:opacity-50 cursor-pointer shadow-md"
            >
              {carregando
                ? "A processar..."
                : isLogin
                  ? "Entrar"
                  : "Registar Conta"}
            </button>
          </form>

          <div className="my-6 flex items-center justify-center gap-3">
            <div className="h-[1px] flex-1 bg-gray-200"></div>
            <span className="text-xs text-gray-400 font-bold">ou</span>
            <div className="h-[1px] flex-1 bg-gray-200"></div>
          </div>

          <button
            type="button"
            onClick={loginComGoogle}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white p-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 shadow-sm cursor-pointer"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              className="w-4 h-4"
              alt="Google"
            />
            <span>Continuar com Google</span>
          </button>

          <p className="mt-6 text-center text-xs text-gray-400 font-medium">
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
                  className="text-gray-700 font-bold hover:underline cursor-pointer bg-transparent border-none p-0 inline text-xs"
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
                  className="text-gray-700 font-bold hover:underline cursor-pointer bg-transparent border-none p-0 inline text-xs"
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