import { useEffect, useState } from "react"; 
import Login from "./Login";
import GmudAgendaForm from "./GmudAgendaForm";
import SolicitacoesEnviadas from "./SolicitacoesEnviadas";
import Supervisao from "./Supervisao";
import DiretoriaMedica from "./DiretoriaMedica";
import DiretoriaTI from "./DiretoriaTI";

export default function App() {
  const [user, setUser] = useState<string | null>(localStorage.getItem("user"));
  const [role, setRole] = useState<"medico" | "supervisao" | "ti" |"diretoria">("medico");
  const [screen, setScreen] = useState<"form" | "historico" | "supervisao" | "ti" |"diretoria">("form");
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

    const name = username.toLowerCase();

    if (name === "supervisao") {
      setRole("supervisao");
      setScreen("supervisao");
    } 
    else if (name === "ti") {
      setRole("ti");
      setScreen("ti");
    } 
    else if (name === "diretoria" || name === "diretoria medica" || name === "diretor") {
      setRole("diretoria");
      setScreen("diretoria");
    } else {
      setRole("medico");
      setScreen("form");
    }
  }

  // 🔄 Controle de telas
  if (!user) return <Login onLogin={handleLogin} />;

  // 👩‍💼 Tela da Supervisão
  if (role === "supervisao" && screen === "supervisao") {
    return (
      <Supervisao
        onVoltar={handleLogout}
      />
    );
  }

  // 👨‍⚕️ Tela da Diretoria Médica
  if (role === "diretoria" && screen === "diretoria") {
    return (
      <DiretoriaMedica
        onVoltar={handleLogout}
      />
    );
  }
  // Tela da TI
  if (role === "ti" && screen === "ti") {
    return (
      <DiretoriaTI
        onVoltar={handleLogout}
      />
    );
  }

  // 📜 Histórico (Médico)
  if (screen === "historico") {
    return (
      <SolicitacoesEnviadas
        onVoltar={() => setScreen("form")}
        onLogout={handleLogout}
      />
    );
  }

  // 🩺 Formulário de criação (Médico)
  return (
    <GmudAgendaForm
      user={user}
      onLogout={handleLogout}
      onShowHistorico={() => setScreen("historico")}
    />
  );
}
