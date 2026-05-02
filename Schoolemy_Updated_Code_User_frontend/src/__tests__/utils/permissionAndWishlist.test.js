import {
  hasAdminRole,
  hasInstructorRole,
  hasStudentRole,
  canCreateContent,
  canDeleteContent,
  canEditContent,
  getUserRole,
  checkPermissionUI,
  logAdminOperation,
} from '../../utils/permissionManager';
import {
  getWishlistStorageKey,
  readBookmarkIdsFromPrimaryKey,
  writeBookmarkIdsToPrimaryKey,
  collectAllBookmarkIdsFromStorage,
} from '../../utils/wishlistStorage';

describe('permissionManager', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const admin = { role: 'admin' };
  const student = { role: 'student' };

  it('role checks', () => {
    expect(hasAdminRole(admin)).toBe(true);
    expect(hasAdminRole(student)).toBe(false);
    expect(hasStudentRole(student)).toBe(true);
    expect(hasInstructorRole({ role: 'instructor' })).toBe(true);
  });

  it('content permission helpers', () => {
    expect(canCreateContent(admin)).toBe(true);
    expect(canEditContent(admin, { authorId: 'x' })).toBe(true);
    expect(canDeleteContent(admin, { authorId: 'x' })).toBe(true);
    expect(getUserRole(student)).toBeTruthy();
    expect(checkPermissionUI(student, 'admin', 'x')).toBe(false);
  });

  it('logAdminOperation', () => {
    expect(() => logAdminOperation('op', 'u1', {})).not.toThrow();
  });
});

describe('wishlistStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('userId', 'user-99');
  });

  it('storage key and bookmark round-trip', () => {
    expect(getWishlistStorageKey()).toContain('user-99');
    writeBookmarkIdsToPrimaryKey(['a', 'b']);
    expect(readBookmarkIdsFromPrimaryKey()).toEqual(['a', 'b']);
    expect(collectAllBookmarkIdsFromStorage().length).toBeGreaterThanOrEqual(0);
  });
});
