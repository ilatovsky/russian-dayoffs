import { DAY_OFFS, WORK_DAYS, HALF_HOLIDAYS } from './data';
import { Interval } from 'date-fns';
import isWithinInterval from 'date-fns/isWithinInterval';
import eachDayOfInterval from 'date-fns/eachDayOfInterval';
import format from 'date-fns/format';

export { Interval };

const DEFAULT_WORKING_HOURS: [number, number] = [9, 18];
const DEFAULT_WEEK_DAY_OFFS = [0, 6];

function getWorkInterval(date: Date, workingHours: [number, number]): Interval {
	return ({
		start: new Date(date).setHours(workingHours[0], 0, 0, 0),
		end: new Date(date).setHours(workingHours[1], 0, 0, 0),
	})
}

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
		(date, index, array) => {
			const dateString = format(date, 'y.L.d');
			let workingInterval: Interval | undefined;
			if (weekDayOffs.includes(date.getDay())) {
				if (workDaysInInterval.includes(dateString)) {
					workingInterval = getWorkInterval(date, workingHours);
				}
			} else {
				if (options?.halfHolidayWorkingHours) {
					if (halfHolidaysInInterval.includes(dateString)) {
						workingInterval = getWorkInterval(date, options.halfHolidayWorkingHours);
					}
				}
				if ((!dayOffsInInterval.includes(dateString) || options?.excludeHolidays?.includes(DAY_OFFS[dateString] as string) && !workingInterval)) {
					workingInterval = getWorkInterval(date, workingHours);
				}
			}
			if (!workingInterval) {
				return;
			}
			
			if (index === 0 && interval.start > workingInterval.start) {
				workingInterval.start = new Date(interval.start).getTime();
			}

			if (index === array.length - 1 && interval.end < workingInterval.end) {
				workingInterval.end = new Date(interval.end).getTime();
			}
			
			workingIntervals.push(workingInterval);
		}
	);
	
	return workingIntervals;
};