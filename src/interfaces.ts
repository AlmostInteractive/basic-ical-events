export interface iCalEvent {
  status?: any;
  completion?: any;
  completed?: any;
  due?: any;
  exdate: any;
  recurrences: any;
  rrule?: any;
  startDate?: any;
  endDate?: any;
  recurrenceId?: any;
  item?: any;
  type?: string;
  duration?: any;
  attendees?: any;
  attendee?: any;
  organizer?: string;
  summary?: any;
  topic?: string;
  location?: string;
  start?: Date
  end?: Date;
  datetype?: string;
  event?: string;
  description?: string;
  id?: string;
  allDay?: boolean;
  rule?: string;
  on?: boolean;
  off?: boolean;
  calendarName?: string;
  uid?: string;
  categories?: string[];
  alarms?: any[]
}

export interface CalendarConfig {
  url: string;
  rejectUnauthorized?: boolean;
  username?: string;
  password?: string;
}

export interface ExDate extends Date {
  dateOnly: boolean;
}

export interface Recurrance extends iCalEvent {
  recurrenceid: Date;
}

export interface CalendarEvent {
  eventStart: Date;
  eventEnd: Date;
  exdate?: { [id: string]: ExDate };
  recurrences?: { [id: string]: Recurrance };
  summary?: string | { val: string; params: any };
  location?: string;
  date?: string;
  event?: string;
  description?: string;
  id?: string;
  allDay?: boolean;
  rrule?: any;
  rruleText?: string;
  calendarName?: string;
  uid?: { uid: string; date: string };
  duration?: number;
  durationSeconds?: number;
  organizer?: string;
  isRecurring?: boolean;
  datetype?: string;
  attendee?: any;
  categories?: string[];
  status?: {
    percent?: any;
    completed?: any;
    date?: any;
  };
  originalEvent?: any;
}

export interface ViewWindow {
  past: Date;
  future: Date;
}

export interface ViewWindowParams {
  amount: number;
  units: 'hours' | 'days';
}

export interface EventsFilter {
  now?: Date;
  pastViewWindow?: ViewWindowParams;
  futureViewWindow?: ViewWindowParams;
}
