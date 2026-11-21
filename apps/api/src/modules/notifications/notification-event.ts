export const NotificationEventType = {
  EMAIL_CONFIRMATION_REQUESTED: "EMAIL_CONFIRMATION_REQUESTED",
  PASSWORD_RESET_REQUESTED: "PASSWORD_RESET_REQUESTED",
  ACCOUNT_DELETION_REQUESTED: "ACCOUNT_DELETION_REQUESTED",
  ACCOUNT_REACTIVATED: "ACCOUNT_REACTIVATED",
  ACCOUNT_ROLE_CHANGED: "ACCOUNT_ROLE_CHANGED",
  ACCOUNT_STATUS_CHANGED: "ACCOUNT_STATUS_CHANGED",
  ORDER_CONFIRMED: "ORDER_CONFIRMED",
  ORDER_FULFILLMENT_UPDATED: "ORDER_FULFILLMENT_UPDATED",
} as const;

export type NotificationEventType =
  (typeof NotificationEventType)[keyof typeof NotificationEventType];

export interface SimulatedEmailNotification {
  eventKey: string;
  eventType: NotificationEventType;
  toEmail: string;
  subject: string;
  body: string;
}

export interface SimulatedEmailMessage {
  toEmail: string;
  subject: string;
  body: string;
}
