import { Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getStoredAuthUser } from "@/lib/auth";

export function AiAgentAssistantWidget() {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = getStoredAuthUser();

  if (!authUser || location.pathname === "/nexo-bot") {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[90]">
      <Button
        type="button"
        onClick={() => navigate("/nexo-bot")}
        className="h-14 rounded-full border-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 px-4 text-white shadow-2xl shadow-cyan-500/25 hover:opacity-95"
      >
        <Sparkles className="h-5 w-5" />
        <span className="text-sm font-semibold">Nexo bot</span>
      </Button>
    </div>
  );
}
