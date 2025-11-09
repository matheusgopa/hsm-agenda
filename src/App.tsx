import { useEffect, useState } from "react";
import Login from "./Login";
import GmudAgendaForm from "./GmudAgendaForm";
import SolicitacoesEnviadas from "./SolicitacoesEnviadas";
import Supervisao from "./Supervisao";

export default function App() {
  const [user, setUser] = useState<string | null>(localStorage.getItem("user"));
  const [role, setRole] = useState<"medico" | "supervisao">("medico");
  const [screen, setScreen] = useState<"form" | "historico" | "supervisao">(
    "form"
  );
  const [lastActivity, setLastActivity] = useState(Date.now());

  // 🕒 Sessão expira após 10 minutos sem atividade
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

  function handleLogout() {
    localStorage.removeItem("user");
    setUser(null);
  }

  // 🔐 Quando o login acontece:
  function handleLogin(username: string) {
    setUser(username);
    localStorage.setItem("user", username);

    // Se o usuário for "supervisao", muda o perfil automaticamente
    if (username.toLowerCase() === "supervisao") {
      setRole("supervisao");
      setScreen("supervisao");
    } else {
      setRole("medico");
      setScreen("form");
    }
  }

  // 🔄 Controle de telas
  if (!user) return <Login onLogin={handleLogin} />;

  if (role === "supervisao") {
    return <Supervisao onVoltar={handleLogout} />;
  }

  if (screen === "historico") {
    return (
      <SolicitacoesEnviadas
        onVoltar={() => setScreen("form")}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <GmudAgendaForm
      user={user}
      onLogout={handleLogout}
      onShowHistorico={() => setScreen("historico")}
    />
  );
}
