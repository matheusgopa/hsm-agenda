import { useEffect, useState } from "react";

import Login from "./Login";
import GmudAgendaForm from "./GmudAgendaForm";
import SolicitacoesEnviadas from "./SolicitacoesEnviadas";

import TelaSupervisao from "./TelaSupervisao";
import TelaAprovacao from "./TelaAprovacao";
import TelaExecucao from "./TelaExecucao";

type Role = "medico" | "supervisao" | "ti" | "diretoria";
type Screen = "form" | "historico" | "supervisao" | "ti" | "diretoria";

export default function App() {
  const [user, setUser] = useState<string | null>(localStorage.getItem("user"));
  const [role, setRole] = useState<Role>("medico");
  const [screen, setScreen] = useState<Screen>("form");
  const [lastActivity, setLastActivity] = useState(Date.now());

  // ⏳ Expiração automática da sessão — 10 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && Date.now() - lastActivity > 10 * 60 * 1000) {
        alert("Sessão expirada por inatividade.");
        handleLogout();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [user, lastActivity]);

  useEffect(() => {
    const updateActivity = () => setLastActivity(Date.now());
    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);

    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
    };
  }, []);

  // 🔐 Logout
  function handleLogout() {
    localStorage.removeItem("user");
    setUser(null);
  }

  // 🔑 Login
  function handleLogin(username: string) {
    setUser(username);
    localStorage.setItem("user", username);

    const name = username.toLowerCase();

    if (name === "supervisao") {
      setRole("supervisao");
      setScreen("supervisao");
    } 
    else if (name === "ti") {
      setRole("ti");
      setScreen("ti");
    } 
    else if (name.includes("diretoria") || name === "diretor") {
      setRole("diretoria");
      setScreen("diretoria");
    } 
    else {
      setRole("medico");
      setScreen("form");
    }
  }

  // 👤 Sem login → mostrar tela de login
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // 🟡 Tela da Supervisão
  if (role === "supervisao" && screen === "supervisao") {
    return <TelaSupervisao onVoltar={handleLogout} />;
  }

  // 🔵 Tela da Diretoria Médica
  if (role === "diretoria" && screen === "diretoria") {
    return <TelaAprovacao onVoltar={handleLogout} />;
  }

  // 🟣 Tela da TI
  if (role === "ti" && screen === "ti") {
    return <TelaExecucao onVoltar={handleLogout} />;
  }

  // 📜 Histórico do Médico
  if (screen === "historico") {
    return (
      <SolicitacoesEnviadas
        onVoltar={() => setScreen("form")}
        onLogout={handleLogout}
      />
    );
  }

  // 🩺 Formulário do Médico
  return (
    <GmudAgendaForm
      user={user}
      onLogout={handleLogout}
      onShowHistorico={() => setScreen("historico")}
    />
  );
}
