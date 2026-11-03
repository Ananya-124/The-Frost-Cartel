export type AppView = 'public' | 'admin';

export interface RouteConfig {
  path: string;
  view: AppView;
  name: string;
}

