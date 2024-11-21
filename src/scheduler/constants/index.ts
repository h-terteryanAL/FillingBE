// Minute | Hour | Day of Month | Month | Day of the Week
export enum ScheduleTimeENUM {
  EVERY_DAY = '0 0 * * *',
  EVERY_YEAR = '0 0 1 1 *',
  EVERY_MINUTE = '* * * * *',
  EVERY_3_MINUTES = '*/3 * * * *',
}
