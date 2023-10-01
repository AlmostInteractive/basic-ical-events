import moment from 'moment-timezone';

const ce = require('cloneextend');
const RRule = require('rrule').RRule;
import { CalendarConfig, CalendarEvent, EventsFilter, ExDate, ViewWindow } from './interfaces';
import { fetchFromFile, fetchFromURL } from './icalUtils';
//@ts-ignore
import { convertEventData, convertRawEventData, formatDate } from './convert';

// 10 years back and forward is a reasonable default window
const DEFAULT_FILTER: EventsFilter = {
  pastViewWindow: {
    amount: 365 * 10,
    units: 'days',
  },
  futureViewWindow: {
    amount: 365 * 10,
    units: 'days',
  },
};

export class icalCalendar {
  private readonly _config: CalendarConfig;
  private _loaded: boolean = false;
  private _loadingPromise: Promise<any> | undefined;
  private _events: CalendarEvent[] = [];


  // ----- Static methods --------------------

  public static countdown(date: Date | string | number) {
    let seconds = (new Date(date).getTime() - new Date().getTime()) / 1000;
    const sign = seconds >= 0 ? 1 : -1;
    seconds = Math.floor(seconds * sign);

    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);

    return {
      days: d * sign,
      hours: h * sign,
      minutes: m * sign,
      seconds: s * sign,
    };
  }


  // ----- Public methods --------------------

  constructor(config: CalendarConfig) {
    this._config = Object.assign({}, config);

    if (this._config.url.match(/^webcal:\/\//)) {
      this._config.url = this._config.url.replace('webcal', 'https');
    }
  }

  public async updateCalendar() {
    if (this._loadingPromise) {
      return await this._loadingPromise;
    }

    this._loaded = false;

    this._loadingPromise = new Promise<void>(async (resolve, reject) => {
      try {
        let data;
        if (this._config.url.match(/^https?:\/\//)) {
          const options = { headers: {} };
          const username = this._config.username;
          const password = this._config.password;

          if (username && password) {
            const auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
            options.headers = { 'Authorization': auth };
          }

          data = await fetchFromURL(this._config.url, options);
        } else {
          data = await fetchFromFile(this._config.url);
        }

        this._events = convertRawEventData(data);

        this._loadingPromise = undefined;
        this._loaded = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    return await this._loadingPromise;
  }

  // @ts-ignore
  public async getEvents(filter?: EventsFilter) {
    if (!this._loaded) {
      await this.updateCalendar();
    }

    return this.getFilteredEvents(Object.assign({}, DEFAULT_FILTER, filter));
  }

  public debugPrint(events?: CalendarEvent[]) {
    events = events || this._events.slice();
    events.sort((a, b) => a.eventStart < b.eventStart ? -1 : 1);
    events.forEach(event => console.log(event.summary, event.eventStart, event.eventEnd));
  }


  // ----- Private methods --------------------

  private getFilteredEvents(filter: EventsFilter) {
    filter.now = filter.now || new Date();
    const viewWindow = makeViewWindow(filter);
    const events: CalendarEvent[] = [];

    this._events.forEach(ev => {
      // non reoccurring events
      if (ev.rrule === undefined) {
        if (isInViewWindow(ev, viewWindow)) {
          events.push(ev);
        }
        return;
      }

      // reoccurring events
      const evs = processRRule(ev, viewWindow);
      evs.forEach(ev => {
        if (isInViewWindow(ev, viewWindow)) {
          events.push(ev);
        }
      });
    });

    return events;
  }

}


const makeViewWindow = (filter: EventsFilter): ViewWindow => {
  let pastMoment = moment(filter.now);
  const pastDuration = moment.duration(JSON.parse(`{"${filter.pastViewWindow!.units}" : ${filter.pastViewWindow!.amount}}`));
  switch (filter.pastViewWindow!.units) {
    case 'hours':
      pastMoment = pastMoment.startOf('hour');
      break;
    case 'days':
      pastMoment = pastMoment.startOf('day');
  }
  pastMoment = pastMoment.subtract(pastDuration);

  let futureMoment = moment(filter.now);
  const futureDuration = moment.duration(JSON.parse(`{"${filter.futureViewWindow!.units}" : ${filter.futureViewWindow!.amount}}`));
  switch (filter.futureViewWindow!.units) {
    case 'hours':
      futureMoment = futureMoment.endOf('hour');
      break;
    case 'days':
      futureMoment = futureMoment.endOf('day');
  }
  futureMoment = futureMoment.add(futureDuration);

  return { past: pastMoment.toDate(), future: futureMoment.toDate() };
};

const isInViewWindow = (ev: CalendarEvent, { past, future }: ViewWindow) => {
  if (!ev.eventStart) {
    return false;
  }

  if (!ev.eventEnd) {
    ev.eventEnd = ev.eventStart;
  }

  if (
    !ev.eventStart.getHours() &&
    !ev.eventStart.getMinutes() &&
    !ev.eventStart.getSeconds() &&
    !ev.eventEnd.getHours() &&
    !ev.eventEnd.getMinutes() &&
    !ev.eventEnd.getSeconds()
  ) {
    if (ev.eventEnd.getTime() == ev.eventStart.getTime() && ev.datetype == 'date') {
      ev.eventEnd.setDate(ev.eventEnd.getDate() + 1);
    }
  }

  return (
    (past <= ev.eventStart && ev.eventStart < future) ||
    (past <= ev.eventEnd && ev.eventEnd < future) ||
    (ev.eventStart < past && future < ev.eventEnd)
  );
};

const processRRule = (ev: CalendarEvent, { past, future }: ViewWindow) => {
  const eventLength = ev.eventEnd.getTime() - ev.eventStart.getTime();
  const options = RRule.parseString(ev.rrule.toString());
  options.tzid = null; // this is already taken into account when the eventStart was created, dont account for it twice
  const rule = new RRule(options);

  let dates: Date[] = [];
  try {
    dates = rule.between(past, future, true);
  } catch (e) {
    throw ('Issue detected in RRule, event ignored; ' + (e as any).stack + '\n' + 'RRule object: ' + JSON.stringify(rule) + '\n' + 'string: ' + ev.rrule.toString() + '\n' + 'options: ' + JSON.stringify(options));
  }

  const exdates: ExDate[] = [];
  for (let i in ev.exdate) {
    exdates.push(ev.exdate[i]);
  }

  const events: CalendarEvent[] = [];
  if (dates.length > 0) {
    dates.forEach(start => {
      let evCopy = ce.clone(ev) as CalendarEvent;
      evCopy.eventStart = new Date(start);
      evCopy.eventEnd = new Date(evCopy.eventStart.getTime() + eventLength);

      const isExcluded = !exdates.every((exdate => {
        if (exdate.dateOnly) {
          return !(
            (exdate.getFullYear() === evCopy.eventStart.getFullYear()) &&
            (exdate.getMonth() === evCopy.eventStart.getMonth()) &&
            (exdate.getDate() === evCopy.eventStart.getDate())
          );
        }

        return !(exdate.getTime() === evCopy.eventStart.getTime());
      }));

      if (isExcluded) {
        return;
      }

      if (ev.recurrences) {
        for (const dOri in ev.recurrences) {
          let recurrenceid = ev.recurrences[dOri].recurrenceid;
          if (recurrenceid && (typeof recurrenceid.getTime === 'function')) {
            if (recurrenceid.getTime() === evCopy.eventStart?.getTime()) {
              evCopy = convertEventData(ev.recurrences[dOri])!;
            }
          }
        }
      }

      evCopy.date = formatDate(evCopy.eventStart, evCopy.eventEnd);
      events.push(evCopy);
    });
  } else if (ev.recurrences) {
    // for (const dOri in ev.recurrences) {
    //   let recurrenceid = ev.recurrences[dOri].recurrenceid
    //   if (recurrenceid) {
    //     let ev3 = ce.clone(ev.recurrences[dOri])
    //     let ev1 = convertEvent(ev3, this.calendarConfig, this.filterConfig);
    //     if ((ev1?.eventStart! >= pastview && ev1?.eventStart! <= preview) || (ev1?.eventEnd! >= pastview && ev1?.eventEnd! <= preview)) {
    //       let date = formatDate(ev1, ev1?.eventStart as Date, ev1?.eventEnd as Date, true, this.filterConfig);
    //       ev1!.date = date.trim();
    //       events.push(ev1);
    //     }
    //   }
    // }
  }
  return events;
};
