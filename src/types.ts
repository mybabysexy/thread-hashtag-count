export interface BrowserlessEndpoint {
  url: string;
  token: string;
}

export interface InitOptions {
  url: string;
  execTimeLimit?: number;
  totalItemsLimit?: number;
}

export interface PostData {
  id: string;
  time: string;
  link: string;
  likes: string;
  comments: string;
  reposts: string;
}
