/** Роль в контексте передержки (можно комбинировать в будущем). */
export type ProfileRole = 'sitter' | 'seeker' | 'both';

/** Публичный профиль пользователя (витрина). */
export type PublicProfile = {
  id: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  galleryUrls: string[];
  roles: ProfileRole[];
  /** Средний рейтинг 0–5 */
  ratingAvg: number;
  reviewCount: number;
};

export type Review = {
  id: string;
  authorId: string;
  authorName: string;
  rating: number;
  text: string;
  createdAt: string;
};
