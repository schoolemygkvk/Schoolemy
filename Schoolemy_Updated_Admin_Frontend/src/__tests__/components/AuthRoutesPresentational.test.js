import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AuthLoading from "../../Components/Auth/AuthLoading";
import ProtectedRoute from "../../Components/Auth/ProtectedRoute";
import PublicRoute from "../../Components/Auth/PublicRoute";
import { AuthProvider } from "../../Components/Auth/AuthProvider";

jest.mock("../../Utils/security", () => ({
  secureStorage: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() },
  isValidToken: jest.fn(() => false),
  hasStoredSession: jest.fn(() => false),
}));

jest.mock("../../Utils/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

import { secureStorage } from "../../Utils/security";

const renderWithRouter = (ui, { initialEntries = ["/"] } = {}) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );

describe("Auth presentational routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    secureStorage.getItem.mockReturnValue(null);
  });

  it("AuthLoading shows spinner text", () => {
    render(<AuthLoading />);
    expect(screen.getByText(/Checking authentication/i)).toBeInTheDocument();
  });

  it("ProtectedRoute does not render children without a full AuthProvider session", async () => {
    secureStorage.getItem.mockImplementation((key) => {
      if (key === "token") return "header.payload.sig";
      return null;
    });

    renderWithRouter(
      <Routes>
        <Route
          path="/schoolemy"
          element={
            <ProtectedRoute>
              <div>secret</div>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<div>login</div>} />
      </Routes>,
      { initialEntries: ["/schoolemy"] },
    );

    await waitFor(() => {
      expect(screen.queryByText("secret")).not.toBeInTheDocument();
    });
  });

  it("ProtectedRoute renders children when id, role, and name are stored", async () => {
    secureStorage.getItem.mockImplementation((key) => {
      const map = { _id: "u1", role: "admin", name: "Ada" };
      return map[key] ?? null;
    });

    renderWithRouter(
      <Routes>
        <Route
          path="/schoolemy"
          element={
            <ProtectedRoute>
              <div>dashboard</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { initialEntries: ["/schoolemy"] },
    );

    await waitFor(() => {
      expect(screen.getByText("dashboard")).toBeInTheDocument();
    });
  });

  it("PublicRoute renders children when not authenticated", async () => {
    secureStorage.getItem.mockReturnValue(null);

    renderWithRouter(
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <div>login-page</div>
            </PublicRoute>
          }
        />
      </Routes>,
      { initialEntries: ["/"] },
    );

    await waitFor(() => {
      expect(screen.getByText("login-page")).toBeInTheDocument();
    });
  });
});
