export type Language = 'en' | 'vi'
export interface Category { id: string; slug: string; nameEn: string; nameVi: string; descriptionEn?: string | null; descriptionVi?: string | null; isArchived: boolean; createdAt: string; updatedAt: string }
export interface Post {
  id: string; categoryId: string; slug: string; titleEn: string; titleVi: string; excerptEn: string; excerptVi: string;
  bodyEn?: string; bodyVi?: string; coverImageUrl: string | null; coverImageAltEn: string | null; coverImageAltVi: string | null;
  seoTitleEn: string | null; seoTitleVi: string | null; seoDescriptionEn: string | null; seoDescriptionVi: string | null;
  status: 'draft' | 'published' | 'archived'; publishedAt: string | null; createdAt: string; updatedAt: string; viewCount: number;
  category: Pick<Category, 'id' | 'slug' | 'nameEn' | 'nameVi'>;
}
export interface PublicComment { id: string; body: string; createdAt: string }
export interface AdminComment extends PublicComment { postId: string; status: 'pending' | 'approved' | 'rejected' | 'spam'; updatedAt: string; moderationReason: string | null; reviewedAt: string | null }
export interface Doc { slug: string; title: string; description: string; body: string; lang: Language; order: number }
export interface PageData {
  kind: 'home' | 'archive' | 'article' | 'docs' | 'doc' | 'about' | 'login' | 'admin' | 'not-found' | 'error';
  path: string; lang: Language; title: string; description: string; status: number;
  posts?: Post[]; post?: Post; categories?: Category[]; years?: string[]; total?: number; page?: number; limit?: number;
  comments?: PublicComment[]; related?: Pick<Post, 'id' | 'slug' | 'titleEn' | 'titleVi' | 'excerptEn' | 'excerptVi'>[];
  docs?: Doc[]; doc?: Doc; query?: { q: string; category: string; year: string; sort: string };
  adminEmail?: string;
}
export const localized = (row: object, field: string, lang: Language): string => {
  const values = row as Record<string, unknown>
  return String(values[field + (lang === 'vi' ? 'Vi' : 'En')] ?? values[field + 'En'] ?? '')
}
export function localPath(path: string, lang: Language) { const url = new URL(path, 'http://local'); url.searchParams.set('lang', lang); return url.pathname + url.search + url.hash }
export function displayDate(value: string | null, lang: Language) { return value ? new Date(value).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '' }
