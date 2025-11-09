import * as React from "react";
import { useState } from "react";
import {
  FaUserMd,
  FaLock,
  FaFingerprint,
  FaMoon,
  FaSun,
} from "react-icons/fa";
import hsmLogo from "./assets/hsm-logo.png"; // ✅ Caminho correto dentro de src/

export default function Login({ onLogin }: { onLogin: (user: string) => void }) {
  const [darkMode, setDarkMode] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin() {
    if (!username.trim()) return;
    localStorage.setItem("user", username);
    onLogin(username);
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-500 ${
        darkMode
          ? "bg-gradient-to-b from-hsmBlue to-gray-900 text-white"
          : "bg-gradient-to-b from-hsmBlue/10 to-hsmGray text-gray-800"
      }`}
    >
      {/* 🌙 Botão modo claro/escuro */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-6 right-6 p-2 rounded-full bg-hsmBlue text-white hover:bg-hsmCyan transition"
        title={darkMode ? "Modo claro" : "Modo noturno"}
      >
        {darkMode ? <FaSun /> : <FaMoon />}
      </button>

      {/* 🏥 Logo Hospital */}
<div className="flex flex-col items-center mb-8">
  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl shadow-md hover:shadow-xl transition-all duration-500">
    <img
      src={hsmLogo}
      alt="Logo Hospital HSM"
      className="w-44 sm:w-52 md:w-60 lg:w-64 h-auto mx-auto object-contain rounded-xl transition-transform duration-500 hover:scale-105"
    />
  </div>
  <h1
    className={`text-3xl font-bold mt-4 ${
      darkMode ? "text-hsmCyan" : "text-hsmBlue"
    }`}
  >
    Hospital HSM
  </h1>
  <p className="text-base font-medium mt-1 text-center opacity-90">
    Sistema de Acesso Médico
  </p>
</div>


      {/* 🧾 Card de Login */}
      <div
        className={`flex flex-col items-center rounded-2xl p-10 w-full max-w-sm shadow-2xl transition-all duration-500 ${
          darkMode ? "bg-gray-800/70 border border-hsmCyan/30" : "bg-white"
        }`}
      >
        {/* Campo Usuário */}
        <label className="flex items-center border border-hsmCyan rounded-lg px-3 py-2 w-full mb-4">
          <FaUserMd className="text-hsmCyan mr-2" />
          <input
            type="text"
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`w-full bg-transparent outline-none ${
              darkMode ? "text-white placeholder-gray-400" : "text-gray-700"
            }`}
          />
        </label>

        {/* Campo Senha */}
        <label className="flex items-center border border-hsmCyan rounded-lg px-3 py-2 w-full mb-6">
          <FaLock className="text-hsmCyan mr-2" />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full bg-transparent outline-none ${
              darkMode ? "text-white placeholder-gray-400" : "text-gray-700"
            }`}
          />
        </label>

        {/* Botão Entrar */}
        <button
          onClick={handleLogin}
          className={`w-full py-2 rounded-lg font-semibold transition ${
            darkMode
              ? "bg-hsmCyan text-gray-900 hover:bg-hsmBlue hover:text-white"
              : "bg-hsmBlue text-white hover:bg-hsmCyan"
          }`}
        >
          Entrar
        </button>

        {/* Entrar com Biometria */}
        <button
          className={`mt-3 flex items-center justify-center border border-hsmCyan text-hsmCyan py-2 rounded-lg w-full font-semibold transition ${
            darkMode
              ? "hover:bg-hsmCyan hover:text-gray-900"
              : "hover:bg-hsmBlue hover:text-white"
          }`}
        >
          <FaFingerprint className="mr-2" /> Entrar com Biometria
        </button>

        <p className="text-center text-sm text-gray-500 mt-8">
          © 2025 Hospital HSM — Sistema de Acesso Médico
        </p>
      </div>
    </div>
  );
}
