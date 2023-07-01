import moment from 'moment';
import { duration } from 'moment';
import { v4 } from 'uuid';
import { CalendarEvent, iCalEvent } from './interfaces';

export const convertRawEventData = (rawEventData: any) => {
  const events: CalendarEvent[] = [];

  for (let index in rawEventData) {
    const ev = convertEventData(rawEventData[index]);
    if (ev) {
      events.push(ev);
    }
  }

  return events;
};


export const convertEventData = (event: iCalEvent) => {
  if (event && !Array.isArray(event)) {
    const { startDate, endDate } = getStartEndDate(event);

    const recurrence = event.recurrenceId;
    if (event.item) {
      event = event.item;
    }

    if ((event.type === undefined) || (event.type && (!['VEVENT', 'VTODO', 'VALARM'].includes(event.type)))) {
      return undefined;
    }

    if (event.duration?.wrappedJSObject) {
      delete event.duration.wrappedJSObject;
    }

    const uid = {
      uid: event.uid || v4(),
      date: '',
    };
    if (recurrence) {
      uid.date = new Date(recurrence.year, recurrence.month, recurrence.day, recurrence.hour, recurrence.minute, recurrence.second).getTime().toString();
    } else {
      uid.date = startDate.getTime().toString();
    }

    if (!event.duration) {
      event.duration = moment.duration(endDate.getTime() - startDate.getTime());
    }

    const returnEvent: CalendarEvent = {
      date: formatDate(startDate, endDate),
      eventStart: startDate,
      eventEnd: endDate,
      summary: event.summary || '',
      description: event.description || '',
      attendee: event.attendees || event.attendee,
      duration: (typeof event.duration?.toICALString === 'function') ? event.duration?.toICALString() : event.duration.toString(),
      durationSeconds: (typeof event.duration?.toSeconds === 'function') ? event.duration?.toSeconds() : (moment.duration(event.duration).asSeconds()),
      location: event.location || '',
      organizer: event.organizer || '',
      rrule: event.rrule,
      rruleText: event.rrule?.toText(),
      uid: uid,
      isRecurring: !!recurrence || !!event.rrule,
      datetype: event.type === 'VTODO' ? 'todo' : 'date',
      allDay: isAllDay(event, startDate, endDate),
      calendarName: null as any,
      exdate: event.exdate,
      recurrences: event.recurrences,
      categories: event.categories,
      status: event.type === 'VTODO' ? {
        completed: event.status === 'COMPLETED',
        percent: event.completion,
        date: moment(getDateVal(event.completed)).toDate(),
      } : undefined,
      originalEvent: event,
    };

    Object.keys(returnEvent).forEach(key => {
      if (returnEvent[key as keyof CalendarEvent] === undefined
        || returnEvent[key as keyof CalendarEvent] === ''
        || (Array.isArray(returnEvent[key as keyof CalendarEvent]) && Object.keys(returnEvent[key as keyof CalendarEvent]).length === 0 && returnEvent[key as keyof CalendarEvent].length === 0)) {
        delete returnEvent[key as keyof CalendarEvent];
      }
    });

    return returnEvent;
  }
  return undefined;
}

export const formatDate = (start: Date, end: Date): string => {
  const dateTime: Intl.DateTimeFormat = new Intl.DateTimeFormat();
  if (end >= start)
    //@ts-ignore
    return dateTime.formatRange(start, end);
  //@ts-ignore
  return dateTime.formatRange(end, start);
}

const getStartEndDate = (event: iCalEvent) => {
  const startDate = new Date((!event.type || event.type === 'VEVENT')
    ? (event.startDate?.toJSDate() || moment(getDateVal(event.start)).toDate())
    : moment(getDateVal(event.start) || getDateVal(event.due)).toISOString());

  const endDate = new Date(
    event.endDate?.toJSDate()
    || ((!event.type || event.type === 'VEVENT')
      ? getDateVal(event.end)
      : moment(getDateVal(event.due) || getDateVal(event.end)).toISOString())
    || moment(getDateVal(event.start)).toDate(),
  );

  return { startDate, endDate };
}

const getDateVal = (date: any) => {
  return (date && date.val) ? date.val : date;
}

const isAllDay = (event: any, startDate: Date, endDate: Date): boolean => {
  let allday = false;
  if (!event.duration) {
    const seconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
    allday = ((seconds % 86400) === 0);
  } else {
    /* istanbul ignore else */
    if (/(-)?P(?:([.,\d]+)Y)?(?:([.,\d]+)M)?(?:([.,\d]+)W)?(?:([.,\d]+)D)?(?:T(?:([.,\d]+)H)?(?:([.,\d]+)M)?(?:([.,\d]+)S)?)?/.test(event.duration)) {
      allday = ((duration(event.duration).asSeconds() % 86400) === 0);
    } else {
      allday = ((event.duration.toSeconds() % 86400) === 0);
    }
  }

  return allday;
}
