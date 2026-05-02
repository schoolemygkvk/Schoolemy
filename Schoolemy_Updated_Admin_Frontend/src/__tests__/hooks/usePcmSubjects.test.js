import { renderHook, waitFor } from "@testing-library/react";
import {
  usePcmSubjects,
  subjectColor,
  subjectLabel,
  subjectAvatarLetter,
} from "../../Hooks/usePcmSubjects";

const mockGet = jest.fn();

jest.mock("../../Utils/api", () => ({
  __esModule: true,
  default: { get: (...args) => mockGet(...args) },
}));

jest.mock("../../Hooks/useToken", () => ({
  getToken: jest.fn(() => "fake-token"),
}));

describe("usePcmSubjects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads subjects on success", async () => {
    mockGet.mockResolvedValue({
      data: { success: true, data: [{ name: "Physics", code: "PHY", color: "#111" }] },
    });
    const { result } = renderHook(() => usePcmSubjects());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.subjects).toHaveLength(1);
    expect(result.current.subjectNamesSentence).toBe("Physics");
    expect(result.current.subjectByCode.phy.name).toBe("Physics");
  });

  it("uses fallback sentence when API returns empty", async () => {
    mockGet.mockResolvedValue({ data: { success: true, data: [] } });
    const { result } = renderHook(() => usePcmSubjects());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.subjectNamesSentence).toMatch(/Physics/);
  });

  it("subjectColor subjectLabel subjectAvatarLetter", () => {
    const map = { phy: { name: "Physics", color: "#abc" } };
    expect(subjectColor(map, "PHY")).toBe("#abc");
    expect(subjectColor(map, null)).toBe("#666");
    expect(subjectLabel(map, "PHY")).toBe("Physics");
    expect(subjectLabel({}, "PHY")).toBe("Phy");
    expect(subjectAvatarLetter(map, "PHY")).toBe("P");
    expect(subjectAvatarLetter({}, null)).toBe("?");
  });
});
