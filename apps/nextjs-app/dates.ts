import { addDays, endOfDay } from "date-fns";

export const getDefaultStartDate = (): string =>
  addDays(new Date(), -30).toISOString().split("T")[0];

export const getDefaultEndDate = (): string => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
};

export const setEndDateToEndOfDay = (dateStr?: string | null): string => {
  if (!dateStr) {
    return getDefaultEndDate();
  }
  const date = endOfDay(new Date(dateStr));
  return date.toISOString();
};
