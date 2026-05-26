export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  roleCode: 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER' | string;
  roleName: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser;
}

export interface UserLite {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface UserSummary extends UserLite {
  isActive: boolean;
  deletedAt: string | null;
  roleId: string;
  role: { id: string; code: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface ModuleDto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoleDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissions: string[];
}

export interface PermissionDto {
  id: string;
  code: string;
  description: string;
}

export type NoteStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CitableNoteLite {
  id: string;
  title: string;
  status: NoteStatus;
}

export interface NoteSubNote {
  id: string;
  noteId: string;
  authorId: string;
  content: string;
  type: 'REJECTION_REASON' | 'COMMENT';
  createdAt: string;
  author: UserLite;
}

export type NoteListScope =
  | 'mine'
  | 'mentions'
  | 'received'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'all';

export interface NoteDto {
  id: string;
  authorId: string;
  title: string;
  contentJson: Record<string, unknown>;
  contentText: string;
  status: NoteStatus;
  reviewedById: string | null;
  reviewedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: UserLite;
  reviewedBy: UserLite | null;
  mentions: { user: UserLite }[];
  recipients: { user: UserLite }[];
  subNotes: NoteSubNote[];
}

export interface NoteSyncPayload {
  note: NoteDto;
  add: NoteListScope[];
  remove: NoteListScope[];
}

export type SystemUpdateType = 'BUG_FIX' | 'ENHANCEMENT';
export type SystemUpdatePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SystemUpdateStatus =
  | 'PENDING'
  | 'DEV_APPROVED'
  | 'DEV_REJECTED'
  | 'ADMIN_APPROVED'
  | 'ADMIN_REJECTED'
  | 'COMPLETED';

export interface SystemUpdateComment {
  id: string;
  systemUpdateId: string;
  authorId: string;
  content: string;
  type: 'REJECTION_REASON' | 'COMMENT';
  createdAt: string;
  author: UserLite;
}

export interface SystemUpdateDto {
  id: string;
  requesterId: string;
  moduleId: string;
  type: SystemUpdateType;
  priority: SystemUpdatePriority;
  title: string;
  description: string;
  status: SystemUpdateStatus;
  devReviewedById: string | null;
  devReviewedAt: string | null;
  adminReviewedById: string | null;
  adminReviewedAt: string | null;
  completedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  requester: UserLite;
  module: { id: string; name: string; slug: string };
  devReviewedBy: UserLite | null;
  adminReviewedBy: UserLite | null;
  comments: SystemUpdateComment[];
}

export interface FeatureDocumentDto {
  id: string;
  moduleId: string;
  authorId: string;
  title: string;
  slug: string;
  contentJson: Record<string, unknown>;
  contentText: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  module: { id: string; name: string; slug: string };
  author: { id: string; name: string; avatarUrl?: string | null };
}

export interface ChangelogEntryDto {
  id: string;
  moduleId: string;
  systemUpdateId: string | null;
  title: string;
  summary: string;
  releasedAt: string;
}

export type NotificationType =
  | 'NOTE_PENDING'
  | 'NOTE_MENTION'
  | 'NOTE_RECEIVED'
  | 'NOTE_APPROVED'
  | 'NOTE_REJECTED'
  | 'SYSTEM_UPDATE_NEW'
  | 'SYSTEM_UPDATE_DEV_APPROVED'
  | 'SYSTEM_UPDATE_DEV_REJECTED'
  | 'SYSTEM_UPDATE_ADMIN_APPROVED'
  | 'SYSTEM_UPDATE_ADMIN_REJECTED'
  | 'SYSTEM_UPDATE_COMPLETED';

export interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  referenceId: string;
  referenceType: 'NOTE' | 'SYSTEM_UPDATE';
  isRead: boolean;
  createdAt: string;
}
