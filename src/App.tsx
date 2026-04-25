import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Conversas from "./pages/Conversas";
import Jornada from "./pages/Jornada";
import Fluxos from "./pages/Fluxos";
import Sequencias from "./pages/Sequencias";
import Audios from "./pages/Audios";
import Templates from "./pages/Templates";
import Midias from "./pages/Midias";
import MidiaDetalhe from "./pages/MidiaDetalhe";
import Contatos from "./pages/Contatos";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Perfil from "./pages/Perfil";
import Auditoria from "./pages/Auditoria";
import Usuarios from "./pages/Usuarios";
import NotFound from "./pages/NotFound.tsx";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import TermosUso from "./pages/TermosUso";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PermissionGate from "./components/auth/PermissionGate";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
          <Route path="/termos" element={<TermosUso />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<PermissionGate permission="dashboard"><Dashboard /></PermissionGate>} />
              <Route path="/conversas" element={<PermissionGate permission="conversations"><Conversas /></PermissionGate>} />
              <Route path="/jornada" element={<PermissionGate permission="journey"><Jornada /></PermissionGate>} />
              <Route path="/fluxos" element={<PermissionGate permission="flows"><Fluxos /></PermissionGate>} />
              <Route path="/sequencias" element={<PermissionGate permission="sequences"><Sequencias /></PermissionGate>} />
              <Route path="/audios" element={<PermissionGate permission="audios"><Audios /></PermissionGate>} />
              <Route path="/templates" element={<PermissionGate permission="templates"><Templates /></PermissionGate>} />
              <Route path="/midias" element={<PermissionGate permission="media"><Midias /></PermissionGate>} />
              <Route path="/midias/:id" element={<PermissionGate permission="media"><MidiaDetalhe /></PermissionGate>} />
              <Route path="/contatos" element={<PermissionGate permission="contacts"><Contatos /></PermissionGate>} />
              <Route path="/relatorios" element={<PermissionGate permission="reports"><Relatorios /></PermissionGate>} />
              <Route path="/usuarios" element={<PermissionGate permission="users"><Usuarios /></PermissionGate>} />
              <Route path="/auditoria" element={<PermissionGate permission="audit"><Auditoria /></PermissionGate>} />
              <Route path="/configuracoes" element={<PermissionGate permission="settings"><Configuracoes /></PermissionGate>} />
              <Route path="/perfil" element={<Perfil />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
