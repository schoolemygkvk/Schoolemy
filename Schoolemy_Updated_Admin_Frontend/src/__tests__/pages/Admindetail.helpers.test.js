import {
  getProfileImageSrc,
  getDocumentImageSrc,
  formatDateForInput,
  getRoleDisplayName,
} from "../../Components/Pages/COT-dashboard/admindetailHelpers";

describe("Admindetail helpers", () => {
  it("getProfileImageSrc handles null, URL, data URL, and legacy base64", () => {
    expect(getProfileImageSrc(null)).toBeNull();
    expect(getProfileImageSrc("https://cdn.example.com/p.jpg")).toBe("https://cdn.example.com/p.jpg");
    expect(getProfileImageSrc("blob:http://localhost/uuid")).toBe("blob:http://localhost/uuid");
    expect(getProfileImageSrc("data:image/png;base64,QQ==")).toBe("data:image/png;base64,QQ==");
    expect(getProfileImageSrc("QQ")).toBe("data:image/jpeg;base64,QQ");
  });

  it("getDocumentImageSrc mirrors profile rules", () => {
    expect(getDocumentImageSrc(null)).toBeNull();
    expect(getDocumentImageSrc("https://x/doc")).toBe("https://x/doc");
    expect(getDocumentImageSrc("blob:http://localhost/uuid")).toBe("blob:http://localhost/uuid");
  });

  it("formatDateForInput", () => {
    expect(formatDateForInput("")).toBe("");
    expect(formatDateForInput(null)).toBe("");
    expect(formatDateForInput("not-a-date")).toBe("");
    expect(formatDateForInput(new Date("2024-06-15T12:00:00Z"))).toBe("2024-06-15");
  });

  it("getRoleDisplayName uses list then title-cases", () => {
    const list = [{ roleName: "admin", displayName: "Administrator" }];
    expect(getRoleDisplayName("ADMIN", list)).toBe("Administrator");
    expect(getRoleDisplayName("customRole", [])).toBe("custom Role");
  });
});
