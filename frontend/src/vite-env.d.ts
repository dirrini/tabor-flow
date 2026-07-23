interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_PREMIUM_MONTHLY_PRICE?: string;
  readonly VITE_PREMIUM_ANNUAL_PRICE?: string;
  readonly VITE_GRAPHQL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
