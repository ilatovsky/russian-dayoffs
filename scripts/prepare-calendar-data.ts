import { glob } from 'glob';
import { promisify } from 'util';
import { resolve } from 'path';
import { parse } from 'fast-xml-parser';
import { readFile, writeFile} from 'fs';
import { format } from 'date-fns';

const globAsync = promisify(glob);
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

export interface UnmappedCalendar {
	calendar: {
		year:     number;
		lang:     string;
		date:     string;
		holidays: Holidays;
		days:     Days;
	};
}

export interface Days {
	day: Day[];
}

export interface Day {
	d:  number;
	t:  1|2|3;
	h?: number;
}

export interface Holidays {
	holiday: Holiday[];
}

export interface Holiday {
	id:    number;
	title: string;
}

function getDayOffsMapFromCalendar({ calendar }: UnmappedCalendar) {
	const holidays: Record<string, string> = {};
	const days: [
		Record<string, string | null>, 
		Record<string, string | null>, 
		Record<string, string | null>, 
	] = [{}, {}, {}];

	calendar.holidays.holiday.forEach(holiday => {
		holidays[`${calendar.year}_${holiday.id}`] = holiday.title
	});

	calendar.days.day.forEach((day) => {
		days[day.t - 1][format(new Date(`${calendar.year}.${day.d}`), 'y.L.d') ] = day.h ? `${calendar.year}_${day.h}` : null;
	})
	
	return { days, holidays };
} 

(
	async () => {
		const dataPaths = (await globAsync(resolve(process.cwd(), '**/xmlCalendar/ru/*/calendar.xml')))
		
		let holidays: Record<string, string | null> = {};
		let dayOffs: Record<string, string | null> = {};
		let halfHolidays: Record<string, string | null> = {};
		let workDay: Record<string, string | null> = {};

		(await Promise.all(dataPaths.map(async (path) => {
			try {
				const data: UnmappedCalendar = parse(await readFileAsync(path, 'utf-8'), {
					attributeNamePrefix: "",
					ignoreAttributes:    false,
					parseAttributeValue: true
				})
				return data;
			} catch {
				return null
			}
		}))).filter((parsedData): parsedData is Exclude<typeof parsedData, null> => !!parsedData).forEach(
			yearParsed => {
				const { days, holidays: yearHolidays } = getDayOffsMapFromCalendar(yearParsed);
				holidays = { ...holidays, ...yearHolidays };
				dayOffs = { ...dayOffs, ...days[0] };
				halfHolidays = { ...halfHolidays, ...days[1] };
				workDay = { ...workDay, ...days[2] };
			}
		);

		await writeFileAsync(
			resolve(process.cwd(), './src/data.ts'), 
			[
				`import { Calendar, Holidays } from './types'`,
				`export const DAY_OFFS: Calendar = ${JSON.stringify(dayOffs, null, 4)}`,
				`export const HALF_HOLIDAYS: Calendar = ${JSON.stringify(halfHolidays, null, 4)}`,
				`export const WORK_DAYS: Calendar = ${JSON.stringify(workDay, null, 4)}`,
				`export const HOLIDAYS: Holidays = ${JSON.stringify(holidays, null, 4)}`
			].join(';\n\n')
		)
	}
)()