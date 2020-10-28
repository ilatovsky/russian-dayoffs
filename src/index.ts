import { DAY_OFFS, WORK_DAYS, HALF_HOLIDAYS } from './data';
import { Interval } from 'date-fns';
import isWithinInterval from 'date-fns/isWithinInterval';
import eachDayOfInterval from 'date-fns/eachDayOfInterval';
import format from 'date-fns/format';

export { Interval };

const DEFAULT_WORKING_HOURS = [9, 18];
const DEFAULT_WEEK_DAY_OFFS = [0, 6];

export function getWorkingIntervals(interval: Interval, options?: Partial<{
	weekDayOffs: number[],
	workingHours: [number, number], 
	halfHolidayWorkingHours?: [number, number], 
	excludeHolidays: string[],
}>): Interval[] {
	const weekDayOffs = options?.weekDayOffs || DEFAULT_WEEK_DAY_OFFS;
	const workingHours = options?.workingHours || DEFAULT_WORKING_HOURS;

	const dayOffsInInterval = Object.keys(DAY_OFFS).filter(
		(date) => isWithinInterval(new Date(date), interval)
	);

	const workDaysInInterval = Object.keys(WORK_DAYS).filter(
		(date) => isWithinInterval(new Date(date), interval)
	); 

	const halfHolidaysInInterval = Object.keys(HALF_HOLIDAYS).filter(
		(date) => isWithinInterval(new Date(date), interval)
	); 

	const workingIntervals: Interval[] = [];
	
	eachDayOfInterval(interval).forEach(
		date => {
			const dateString = format(date, 'y.L.d');
			if (weekDayOffs.includes(date.getDay())) {
				if (workDaysInInterval.includes(dateString)) {
					workingIntervals.push({ 
						start: date.setHours(workingHours[0], 0, 0, 0), 
						end: date.setHours(workingHours[1], 0, 0, 0), 
					});
				}
			} else {
				if (options?.halfHolidayWorkingHours) {
					if (halfHolidaysInInterval.includes(dateString)) {
						workingIntervals.push({ 
							start: date.setHours(options.halfHolidayWorkingHours[0], 0, 0, 0), 
							end: date.setHours(options.halfHolidayWorkingHours[1], 0, 0, 0), 
						});	
						return;
					}
				}
				if (!dayOffsInInterval.includes(dateString) || options?.excludeHolidays?.includes(DAY_OFFS[dateString] as string)) {
					workingIntervals.push({ 
						start: date.setHours(workingHours[0], 0, 0, 0), 
						end: date.setHours(workingHours[1], 0, 0, 0), 
					});
				}
			}
		}
	);
	
	return workingIntervals;
};