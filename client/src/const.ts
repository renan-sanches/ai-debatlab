export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// With Supabase Auth, we use our own login page
export const getLoginUrl = () => {
  return "/login";
};
