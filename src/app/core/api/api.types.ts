export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors: Array<{ field: string; message: string }>;
}

export interface UserResponse {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  status: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AlbumResponse {
  id: string;
  name: string;
  description: string | null;
  year: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StickerResponse {
  id: string;
  albumId: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MyProfileResponse {
  userId: string;
  nickname: string | null;
  cep: string | null;
  city: string | null;
  state: string | null;
  approximateLatitude: string | null;
  approximateLongitude: string | null;
  showCityStatePublicly: boolean;
  useLocationForSearch: boolean;
}

export interface PublicProfileResponse {
  userId: string;
  nickname: string | null;
  city: string | null;
  state: string | null;
}

export interface RepeatedStickerResponse {
  id: string;
  stickerId: string;
  stickerNumber: string;
  stickerName: string;
  quantity: number;
  warning: string | null;
}

export interface WantedStickerResponse {
  id: string;
  stickerId: string;
  stickerNumber: string;
  stickerName: string;
  warning: string | null;
}

export type CollectionFilter = 'ALL' | 'REPEATED' | 'WANTED' | 'CONFLICT';

export interface CollectionStickerResponse {
  stickerId: string;
  code: string;
  name: string;
  description: string | null;
  repeatedQuantity: number;
  wanted: boolean;
  warning: string | null;
}

export interface HolderResponse {
  userId: string;
  nickname: string | null;
  city: string | null;
  state: string | null;
  quantity: number;
  isPotentialMatch: boolean;
  lastActivityAt: string | null;
}

export interface ConversationResponse {
  conversationId: string;
  otherUserId: string;
  otherNickname: string | null;
  stickerId: string | null;
  stickerNumber: string | null;
  stickerName: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MessageType = 'TEXT' | 'USER_MESSAGE' | 'SYSTEM_INTENT';

export interface MessageResponse {
  messageId: string;
  conversationId: string;
  senderUserId: string | null;
  type: MessageType;
  body: string;
  sentAt: string;
}

export type NotificationType = 'NEW_INTEREST' | 'NEW_MESSAGE';

export interface NotificationResponse {
  notificationId: string;
  type: NotificationType;
  conversationId: string;
  actorUserId: string | null;
  actorNickname: string | null;
  stickerId: string | null;
  stickerCode: string | null;
  stickerName: string | null;
  read: boolean;
  createdAt: string;
}

export type ReportReason = 'SPAM' | 'INAPPROPRIATE_CONTENT' | 'HARASSMENT' | 'OTHER';
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'DISMISSED';

export interface ReportResponse {
  reportId: string;
  reporterId: string;
  reportedId: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
}
