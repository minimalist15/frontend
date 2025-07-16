export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  source: string;
  publishedAt: string;
  category: string;
  imageUrl?: string;
  readTime: number;
}