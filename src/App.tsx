import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "./pages/Login";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Conversas from "./pages/Conversas";
import Jornada from "./pages/Jornada";
import Fluxos from "./pages/Fluxos";
import Sequencias from "./pages/Sequencias";
import Audios from "./pages/Audios";
import Templates from "./pages/Templates";
import Contatos from "./pages/Contatos";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/conversas" element={<Conversas />} />
            <Route path="/jornada" element={<Jornada />} />
            <Route path="/fluxos" element={<Fluxos />} />
            <Route path="/sequencias" element={<Sequencias />} />
            <Route path="/audios" element={<Audios />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/contatos" element={<Contatos />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/perfil" element={<Perfil />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
