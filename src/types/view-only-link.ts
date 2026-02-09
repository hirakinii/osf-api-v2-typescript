/**
 * View Only Link attributes as returned from the OSF API
 * Note: Uses snake_case to match API response format
 */
export interface OsfViewOnlyLinkAttributes {
  name: string;
  key: string;
  date_created: string;
  anonymous: boolean;
}
