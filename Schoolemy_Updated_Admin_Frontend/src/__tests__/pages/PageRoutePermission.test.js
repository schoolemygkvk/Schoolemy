import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PageRoutePermission from "../../Components/Pages/RBAC-dashboard/PageRoutePermission";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../../Utils/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

import api from "../../Utils/api";

describe("PageRoutePermission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockImplementation((url) => {
      const u = String(url);
      if (u.includes("csrf-token")) {
        return Promise.resolve({ data: {} });
      }
      if (u.includes("/api/rbac/roles") && !u.includes("/api/rbac/roles/")) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              roles: [
                {
                  roleName: "admin",
                  displayName: "Admin",
                  routeAccess: { dashboard: true },
                },
              ],
            },
          },
        });
      }
      if (u.startsWith("/api/rbac/roles/")) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              role: {
                roleName: "admin",
                routeAccess: { dashboard: true },
              },
            },
          },
        });
      }
      return Promise.reject(new Error(`unmocked: ${u}`));
    });
  });

  it("loads roles and shows title", async () => {
    render(
      <MemoryRouter>
        <PageRoutePermission />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/csrf-token", { noAuth: true });
    });
    await waitFor(() => {
      expect(api.get.mock.calls.some((c) => c[0] === "/api/rbac/roles")).toBe(true);
    });
    expect(await screen.findByRole("heading", { name: /Page Route Permissions/i })).toBeInTheDocument();
  });
});
