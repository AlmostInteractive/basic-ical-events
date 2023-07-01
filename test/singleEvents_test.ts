import { expect, use } from 'chai';
import moment = require('moment');
import { icalCalendar } from '../src';
import { describe, afterEach, it } from 'mocha';

const sinon = require('sinon');
use(require('chai-like'));
use(require('chai-things'));

const ICS_URL= './test/mocks/onetime.ics';

describe('oneTime', () => {
  afterEach(function () {
    sinon.restore();
  });

  it('finds all events', async () => {
    const cal = new icalCalendar({
      url: ICS_URL,
    });
    const events = await cal.getEvents({
      now: moment('2011-11-23').toDate(),
    });
    expect(events).to.have.lengthOf(13);
  });

  it('finds windowed events', async () => {
    const cal = new icalCalendar({
      url: ICS_URL,
    });
    const events = await cal.getEvents({
      now: moment('2021-01-11').toDate(),
      pastViewWindow: {
        amount: 10,
        units: 'days',
      },
      futureViewWindow: {
        amount: 10,
        units: 'days',
      },
    });
    expect(events).to.have.lengthOf(3);
  });

  it('finds same-day events', async () => {
    const cal = new icalCalendar({
      url: ICS_URL,
    });
    const events = await cal.getEvents({
      now: moment('2021-03-25').toDate(),
      pastViewWindow: {
        amount: 0,
        units: 'days',
      },
      futureViewWindow: {
        amount: 0,
        units: 'days',
      },
    });
    expect(events).to.have.lengthOf(2);
  });
});
