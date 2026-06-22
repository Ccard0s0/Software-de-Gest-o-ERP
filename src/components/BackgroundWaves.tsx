import React from "react";

interface BackgroundWavesProps {
  lightMode?: boolean;
}

export default function BackgroundWaves({
  lightMode = false,
}: BackgroundWavesProps) {
  return (
    <div
      className={`fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none z-0 transition-colors duration-300 ${
        lightMode ? "bg-slate-50" : "bg-[#0A0915]"
      }`}
    >
      {/* Injeção de CSS nativo para criar o efeito de ondulação fluida */}
      <style>{`
        @keyframes waveMove1 {
          0% {
            transform: translateX(0) scaleY(1);
          }
          50% {
            transform: translateX(-25%) scaleY(1.1);
          }
          100% {
            transform: translateX(0) scaleY(1);
          }
        }
        @keyframes waveMove2 {
          0% {
            transform: translateX(0) scaleY(1);
          }
          50% {
            transform: translateX(15%) scaleY(0.95);
          }
          100% {
            transform: translateX(0) scaleY(1);
          }
        }
        .animate-wave-1 {
          animation: waveMove1 20s ease-in-out infinite;
          transform-origin: center bottom;
        }
        .animate-wave-2 {
          animation: waveMove2 25s ease-in-out infinite;
          transform-origin: center bottom;
        }
      `}</style>

      <svg
        className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
          lightMode ? "opacity-10" : "opacity-40"
        }`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Gradiente Rosa/Roxo/Azul para a primeira onda */}
          <linearGradient
            id="wave-gradient-1"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor="#cd1eb9"
              stopOpacity={lightMode ? "0.08" : "0.25"}
            />
            <stop
              offset="40%"
              stopColor="#8b5cf6"
              stopOpacity={lightMode ? "0.05" : "0.15"}
            />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>

          {/* Gradiente Laranja/Ciano para a segunda onda */}
          <linearGradient
            id="wave-gradient-2"
            x1="100%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor="#E9644A"
              stopOpacity={lightMode ? "0.06" : "0.2"}
            />
            <stop
              offset="60%"
              stopColor="#5bbfeb"
              stopOpacity={lightMode ? "0.02" : "0.05"}
            />
            <stop offset="100%" stopColor="#0A0915" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Onda de Trás (Mais lenta e suave) */}
        <path
          className="animate-wave-2"
          d="M-200,450 C300,300 600,600 1000,350 C1400,100 1600,400 1800,300 L1800,900 L-200,900 Z"
          fill="url(#wave-gradient-2)"
        />

        {/* Onda da Frente (Mais rápida e marcada) */}
        <path
          className="animate-wave-1"
          d="M-200,300 C200,450 500,250 900,400 C1300,550 1500,350 1800,450 L1800,900 L-200,900 Z"
          fill="url(#wave-gradient-1)"
        />
      </svg>
    </div>
  );
}
