import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ChatWindow } from "../ChatWindow";
import { api } from "@/lib/api";

// jsdom does not implement scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// ── Mocks ─────────────────────────────────────────────────────────────────

const mockPublish   = jest.fn();
const mockActivate  = jest.fn();
const mockDeactivate = jest.fn();

// Captures the subscribe callback so tests can simulate incoming WS messages
let capturedSubscribeCb: ((frame: { body: string }) => void) | null = null;

jest.mock("@stomp/stompjs", () => ({
  Client: jest.fn().mockImplementation(({ onConnect }: { onConnect: () => void }) => {
    const client = {
      activate: jest.fn(() => {
        mockActivate();
        // Simulate immediate connection (synchronous for test simplicity)
        onConnect();
      }),
      deactivate: mockDeactivate,
      subscribe: jest.fn((_dest: string, cb: (frame: { body: string }) => void) => {
        capturedSubscribeCb = cb;
      }),
      publish: mockPublish,
      connected: true,
    };
    return client;
  }),
}));

jest.mock("sockjs-client", () => jest.fn());

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { name: "Officer Nash", email: "nash@lspd.com" },
    token: "mock-jwt-token",
  }),
}));

const historyMessages = [
  { id: "msg-1", channel: "POLICE_GENERAL", sender: "Cpl. Reed", content: "All quiet on the strip", createdAt: new Date().toISOString() },
  { id: "msg-2", channel: "POLICE_GENERAL", sender: "Officer Nash", content: "Copy that", createdAt: new Date().toISOString() },
];

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn() },
}));

// ── Tests ─────────────────────────────────────────────────────────────────

describe("ChatWindow", () => {
  const mockApiGet = jest.mocked(api.get);

  beforeEach(() => {
    jest.clearAllMocks();
    capturedSubscribeCb = null;
    mockApiGet.mockResolvedValue(historyMessages);
  });

  describe("initialization", () => {
    it("activates STOMP client on mount", () => {
      render(<ChatWindow channel="POLICE_GENERAL" color="#e8c97e" />);
      expect(mockActivate).toHaveBeenCalled();
    });

    it("deactivates STOMP client on unmount", () => {
      const { unmount } = render(<ChatWindow channel="POLICE_GENERAL" color="#e8c97e" />);
      unmount();
      expect(mockDeactivate).toHaveBeenCalled();
    });

    it("fetches message history for the channel on mount", async () => {
      render(<ChatWindow channel="POLICE_GENERAL" color="#e8c97e" />);

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalledWith("/chat/POLICE_GENERAL/history?limit=100");
      });
    });

    it("displays historical messages after load", async () => {
      render(<ChatWindow channel="POLICE_GENERAL" color="#e8c97e" />);

      await waitFor(() => {
        expect(screen.getByText("All quiet on the strip")).toBeInTheDocument();
        expect(screen.getByText("Copy that")).toBeInTheDocument();
      });
    });

    it("shows 'Conectado' status after STOMP connection", async () => {
      render(<ChatWindow channel="POLICE_GENERAL" color="#e8c97e" />);

      await waitFor(() => {
        expect(screen.getByText("Conectado")).toBeInTheDocument();
      });
    });
  });

  describe("sending messages", () => {
    it("disables send button when input is empty", async () => {
      render(<ChatWindow channel="POLICE_GENERAL" color="#e8c97e" />);
      await waitFor(() => screen.getByText("Conectado"));

      expect(screen.getByText("Enviar")).toBeDisabled();
    });

    it("enables send button when input has content and connected", async () => {
      render(<ChatWindow channel="POLICE_GENERAL" color="#e8c97e" />);
      await waitFor(() => screen.getByText("Conectado"));

      fireEvent.change(screen.getByPlaceholderText("Mensagem..."), { target: { value: "10-4" } });

      expect(screen.getByText("Enviar")).not.toBeDisabled();
    });

    it("publishes message to correct STOMP destination", async () => {
      render(<ChatWindow channel="POLICE_GENERAL" color="#e8c97e" />);
      await waitFor(() => screen.getByText("Conectado"));

      fireEvent.change(screen.getByPlaceholderText("Mensagem..."), {
        target: { value: "Units 5 respond to Grove St" },
      });
      fireEvent.click(screen.getByText("Enviar"));

      expect(mockPublish).toHaveBeenCalledWith(
        expect.objectContaining({
          destination: "/app/chat/POLICE_GENERAL",
          body: expect.stringContaining("Units 5 respond to Grove St"),
        })
      );
    });

    it("clears input after sending a message", async () => {
      render(<ChatWindow channel="POLICE_GENERAL" color="#e8c97e" />);
      await waitFor(() => screen.getByText("Conectado"));

      const input = screen.getByPlaceholderText("Mensagem...");
      fireEvent.change(input, { target: { value: "Test message" } });
      fireEvent.click(screen.getByText("Enviar"));

      expect(input).toHaveValue("");
    });

    it("includes sender name from auth context in published message", async () => {
      render(<ChatWindow channel="POLICE_HC" color="#c084fc" />);
      await waitFor(() => screen.getByText("Conectado"));

      fireEvent.change(screen.getByPlaceholderText("Mensagem..."), {
        target: { value: "HC message" },
      });
      fireEvent.click(screen.getByText("Enviar"));

      expect(mockPublish).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining("Officer Nash"),
        })
      );
    });
  });

  describe("real-time messages", () => {
    it("appends new incoming WebSocket message to list", async () => {
      mockApiGet.mockResolvedValue([]);
      render(<ChatWindow channel="POLICE_GENERAL" color="#e8c97e" />);
      await waitFor(() => screen.getByText("Conectado"));

      const newMsg = {
        id: "msg-ws-1",
        channel: "POLICE_GENERAL",
        sender: "Sgt. Lima",
        content: "Suspect heading north",
        createdAt: new Date().toISOString(),
      };

      act(() => {
        capturedSubscribeCb?.({ body: JSON.stringify(newMsg) });
      });

      await waitFor(() => {
        expect(screen.getByText("Suspect heading north")).toBeInTheDocument();
      });
    });

    it("does not duplicate messages when history and WS overlap", async () => {
      render(<ChatWindow channel="POLICE_GENERAL" color="#e8c97e" />);
      await waitFor(() => screen.getByText("All quiet on the strip"));

      // Same message arrives again via WebSocket
      act(() => {
        capturedSubscribeCb?.({ body: JSON.stringify(historyMessages[0]) });
      });

      // Should appear exactly once
      expect(screen.getAllByText("All quiet on the strip")).toHaveLength(1);
    });
  });

  describe("different channels", () => {
    it("re-fetches history when channel changes", async () => {
      const { rerender } = render(<ChatWindow channel="POLICE_GENERAL" color="#e8c97e" />);
      await waitFor(() => expect(mockApiGet).toHaveBeenCalledWith("/chat/POLICE_GENERAL/history?limit=100"));

      rerender(<ChatWindow channel="POLICE_CADET" color="#8a9ab8" />);

      await waitFor(() => expect(mockApiGet).toHaveBeenCalledWith("/chat/POLICE_CADET/history?limit=100"));
    });
  });
});
