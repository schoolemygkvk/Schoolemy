import { normalizeRouteAccess } from "../../Components/Pages/RBAC-dashboard/PageRoutePermission";

describe("normalizeRouteAccess", () => {
  it("returns {} for non-objects", () => {
    expect(normalizeRouteAccess(null)).toEqual({});
    expect(normalizeRouteAccess(undefined)).toEqual({});
    expect(normalizeRouteAccess("x")).toEqual({});
  });

  it("coerces truthy flags from Mongo/string/number", () => {
    expect(
      normalizeRouteAccess({
        dashboard: true,
        courses: "true",
        vote: 1,
        bos: false,
        off: "false",
      })
    ).toEqual({
      dashboard: true,
      courses: true,
      vote: true,
      bos: false,
      off: false,
    });
  });
});
