import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UnitAvisosSection } from "../UnitAvisosSection";
import { api } from "@/lib/api";
import { UnitAviso } from "@/types";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("@/lib/api", () => ({
  api: {
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { name: "Sgt. Lima", email: "lima@lspd.com" } }),
}));

const mockApi = api as jest.Mocked<typeof api>;

// ── Helpers ───────────────────────────────────────────────────────────────

function aviso(overrides: Partial<UnitAviso> = {}): UnitAviso {
  return {
    id: "aviso-1",
    unit: "CID",
    content: "Operação noturna às 22h",
    createdBy: "Lead CID",
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(), // 5 min ago
    ...overrides,
  };
}

const defaultProps = {
  unit: "CID",
  avisos: [aviso()],
  loading: false,
  canManage: false,
  onAdd: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
};

// ── Tests ─────────────────────────────────────────────────────────────────

describe("UnitAvisosSection", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("rendering", () => {
    it("displays avisos list", () => {
      render(<UnitAvisosSection {...defaultProps} />);
      expect(screen.getByText("Operação noturna às 22h")).toBeInTheDocument();
    });

    it("shows empty state when no avisos", () => {
      render(<UnitAvisosSection {...defaultProps} avisos={[]} />);
      expect(screen.getByText("Nenhum aviso")).toBeInTheDocument();
    });

    it("shows loading state", () => {
      render(<UnitAvisosSection {...defaultProps} loading={true} />);
      expect(screen.getByText("Carregando...")).toBeInTheDocument();
    });

    it("shows aviso author and relative time", () => {
      render(<UnitAvisosSection {...defaultProps} />);
      expect(screen.getByText(/Lead CID/)).toBeInTheDocument();
      expect(screen.getByText(/min atrás/)).toBeInTheDocument();
    });
  });

  describe("access control", () => {
    it("hides post form when canManage is false", () => {
      render(<UnitAvisosSection {...defaultProps} canManage={false} />);
      expect(screen.queryByPlaceholderText("Novo aviso...")).not.toBeInTheDocument();
    });

    it("shows post form when canManage is true", () => {
      render(<UnitAvisosSection {...defaultProps} canManage={true} />);
      expect(screen.getByPlaceholderText("Novo aviso...")).toBeInTheDocument();
    });

    it("hides edit/delete buttons when canManage is false", () => {
      render(<UnitAvisosSection {...defaultProps} canManage={false} />);
      expect(screen.queryByText("Editar")).not.toBeInTheDocument();
      expect(screen.queryByText("✕")).not.toBeInTheDocument();
    });

    it("shows edit/delete buttons when canManage is true", () => {
      render(<UnitAvisosSection {...defaultProps} canManage={true} />);
      expect(screen.getByText("Editar")).toBeInTheDocument();
      expect(screen.getByText("✕")).toBeInTheDocument();
    });
  });

  describe("posting a new aviso", () => {
    it("calls api.post and triggers onAdd callback", async () => {
      const onAdd = jest.fn();
      const newAviso = aviso({ id: "aviso-2", content: "Novo aviso de teste" });
      mockApi.post.mockResolvedValue(newAviso);

      render(<UnitAvisosSection {...defaultProps} canManage={true} onAdd={onAdd} />);

      await userEvent.type(screen.getByPlaceholderText("Novo aviso..."), "Novo aviso de teste");
      fireEvent.click(screen.getByText("Postar"));

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith("/unit-avisos", {
          unit: "CID",
          content: "Novo aviso de teste",
          createdBy: "Sgt. Lima",
        });
        expect(onAdd).toHaveBeenCalledWith(newAviso);
      });
    });

    it("clears input after successful post", async () => {
      mockApi.post.mockResolvedValue(aviso({ id: "aviso-3" }));
      render(<UnitAvisosSection {...defaultProps} canManage={true} />);

      const input = screen.getByPlaceholderText("Novo aviso...");
      await userEvent.type(input, "Test content");
      fireEvent.click(screen.getByText("Postar"));

      await waitFor(() => expect(input).toHaveValue(""));
    });

    it("disables submit button when input is empty", () => {
      render(<UnitAvisosSection {...defaultProps} canManage={true} />);
      expect(screen.getByText("Postar")).toBeDisabled();
    });
  });

  describe("deleting an aviso", () => {
    it("calls api.delete and triggers onDelete callback", async () => {
      const onDelete = jest.fn();
      mockApi.delete = jest.fn().mockResolvedValue(undefined);

      render(<UnitAvisosSection {...defaultProps} canManage={true} onDelete={onDelete} />);

      fireEvent.click(screen.getByText("✕"));

      await waitFor(() => {
        expect(mockApi.delete).toHaveBeenCalledWith("/unit-avisos/aviso-1");
        expect(onDelete).toHaveBeenCalledWith("aviso-1");
      });
    });
  });

  describe("editing an aviso", () => {
    it("opens edit modal with current content when Editar is clicked", () => {
      render(<UnitAvisosSection {...defaultProps} canManage={true} />);

      fireEvent.click(screen.getByText("Editar"));

      expect(screen.getByText("Editar Aviso")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Operação noturna às 22h")).toBeInTheDocument();
    });

    it("closes modal when Cancelar is clicked", () => {
      render(<UnitAvisosSection {...defaultProps} canManage={true} />);

      fireEvent.click(screen.getByText("Editar"));
      fireEvent.click(screen.getByText("Cancelar"));

      expect(screen.queryByText("Editar Aviso")).not.toBeInTheDocument();
    });

    it("calls api.put and triggers onEdit callback on save", async () => {
      const onEdit = jest.fn();
      const updated = aviso({ content: "Aviso atualizado" });
      mockApi.put.mockResolvedValue(updated);

      render(<UnitAvisosSection {...defaultProps} canManage={true} onEdit={onEdit} />);

      fireEvent.click(screen.getByText("Editar"));
      const textarea = screen.getByDisplayValue("Operação noturna às 22h");
      await userEvent.clear(textarea);
      await userEvent.type(textarea, "Aviso atualizado");
      fireEvent.click(screen.getByText("Salvar"));

      await waitFor(() => {
        expect(mockApi.put).toHaveBeenCalledWith("/unit-avisos/aviso-1", { content: "Aviso atualizado" });
        expect(onEdit).toHaveBeenCalledWith(updated);
      });
    });
  });
});
