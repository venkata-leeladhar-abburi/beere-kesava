import type { NotificationsService } from "../../notifications/notifications.service";

/** The four emitters every notification call site goes through. */
export interface NotificationMocks {
  create: jest.Mock;
  notifyRole: jest.Mock;
  notifyUser: jest.Mock;
  notifyWeaver: jest.Mock;
}

/**
 * Stand-in for NotificationsService in unit tests: assignable where the real
 * service is expected, so a subject can be constructed without a gateway or a
 * database, while still letting a spec assert on the exact emitter it uses.
 */
export type NotificationsStub = NotificationMocks & NotificationsService;

/**
 * Bare mocks, for a spec that asserts on the calls. Kept separate from the
 * NotificationsService-shaped stub below so an assertion reads the mock's own
 * function type rather than the class's method type (which
 * @typescript-eslint/unbound-method rightly objects to).
 */
export function notificationMocks(): NotificationMocks {
  return {
    create: jest.fn().mockResolvedValue(null),
    notifyRole: jest.fn().mockResolvedValue(null),
    notifyUser: jest.fn().mockResolvedValue(null),
    notifyWeaver: jest.fn().mockResolvedValue(null),
  };
}

export function notificationsStub(): NotificationsStub {
  return notificationMocks() as unknown as NotificationsStub;
}
