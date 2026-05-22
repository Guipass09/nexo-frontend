import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AiAgentAssistantWidget } from "@/components/ai-agent/AiAgentAssistantWidget";

vi.mock("@/lib/auth", () => ({
  getStoredAuthUser: () => ({
    id: 1,
    name: "Francisco",
    email: "teste@nexo.app",
    role: "admin",
  }),
}));

describe("AiAgentAssistantWidget", () => {
  it("navigates to the dedicated Nexo bot page when the launcher is clicked", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={<AiAgentAssistantWidget />}
          />
          <Route path="/nexo-bot" element={<div>Nexo bot page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /nexo bot/i }));

    expect(screen.getByText("Nexo bot page")).toBeInTheDocument();
  });
});
