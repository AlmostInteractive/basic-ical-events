import { CalendarConfig, CalendarEvent, EventsFilter } from './interfaces';
import { fetchFromFile, fetchFromURL } from './icalUtils';
import { convertRawEventData } from './convert';

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

    this._loadingPromise = new Promise<void>(async (resolve) => {
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
    });

    return await this._loadingPromise;
  }

  // @ts-ignore
  public async getEvents(filter?: EventsFilter) {
    if (!this._loaded) {
      await this.updateCalendar();
    }

    if (!filter) {
      return this._events.slice();
    }

    return this._events.slice();
  }


  // ----- Private methods --------------------

}
