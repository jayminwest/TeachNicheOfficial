export interface Lesson {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnailUrl: string;
  averageRating: number;
  totalRatings: number;
  created_at?: string;
}
