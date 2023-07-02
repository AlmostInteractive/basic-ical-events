import { expect, use } from 'chai';
import moment = require('moment');
import { icalCalendar } from '../src';
import { describe, afterEach, it } from 'mocha';

const sinon = require('sinon');
use(require('chai-like'));
use(require('chai-things'));

const ICS_URL = './test/mocks/rrule.ics';

describe('rrule', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('finds all events', async () => {
    const cal = new icalCalendar({
      url: ICS_URL,
    });
    const events = await cal.getEvents({
      now: moment('2021-11-23').toDate(),
    });
    expect(events).to.have.lengthOf(28);
  });

  it('finds all DATE events', async () => {
    const cal = new icalCalendar({
      url: ICS_URL,
    });
    const events = await cal.getEvents({
      now: moment('2020-06-05').toDate(),
      pastViewWindow: {
        amount: 30,
        units: 'days',
      },
      futureViewWindow: {
        amount: 15,
        units: 'days',
      },
    });
    expect(events).to.have.lengthOf(8);
  });

  it('finds all TZID events', async () => {
    const cal = new icalCalendar({
      url: ICS_URL,
    });
    let events = await cal.getEvents({
      now: moment('2022-01-12').toDate(),
      pastViewWindow: {
        amount: 0,
        units: 'days',
      },
      futureViewWindow: {
        amount: 21,
        units: 'days',
      },
    });
    expect(events).to.have.lengthOf(4);

    events = await cal.getEvents({
      now: moment('2022-01-12T13:00:00Z').toDate(),
      pastViewWindow: {
        amount: 0,
        units: 'hours',
      },
      futureViewWindow: {
        amount: 0,
        units: 'hours',
      },
    });
    expect(events).to.have.lengthOf(0);

    events = await cal.getEvents({
      now: moment('2022-01-12T13:00:00+0200').toDate(),
      pastViewWindow: {
        amount: 0,
        units: 'hours',
      },
      futureViewWindow: {
        amount: 0,
        units: 'hours',
      },
    });
    expect(events).to.have.lengthOf(1);
  });

  it('should obey EXDATE rules', async () => {
    const cal = new icalCalendar({
      url: ICS_URL,
    });
    const events = await cal.getEvents({
      now: moment('2021-11-05').toDate(),
      pastViewWindow: {
        amount: 10,
        units: 'days',
      },
      futureViewWindow: {
        amount: 21,
        units: 'days',
      },
    });
    expect(events).to.have.lengthOf(11);
  });
});
