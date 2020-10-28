export enum DayOffKind {
	DAYOFF = `dayoff`,
	HALF_HOLIDAY = 'half-holiday',
	WORKDAY = 'workday'
}

export type Calendar = Record<string, string | null>
export type Holidays = Record<string, string>;