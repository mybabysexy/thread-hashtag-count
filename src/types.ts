export interface BrowserlessEndpoint {
  url: string;
  token: string;
}

export interface InitOptions {
  url: string;
  execTimeLimit?: number;
  totalItemsLimit?: number;
  includeKeywords?: string[];
}

export interface PostData {
  id: string;
  time: string;
  content: string;
  link: string;
  likes: string;
  comments: string;
  reposts: string;
}
