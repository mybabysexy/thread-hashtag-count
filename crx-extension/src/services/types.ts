export interface InitOptions {
  tagId: string;
  execTimeLimit?: number;
  totalItemsLimit?: number;
  signal: AbortSignal;
  includeKeywords?: string[];
  includeTag?: boolean;
}

export interface PostData {
  id: string;
  time: string;
  link: string;
  content: string;
  likes: string;
  comments: string;
  reposts: string;
}
