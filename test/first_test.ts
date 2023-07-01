import { expect, use } from 'chai';
import moment = require('moment');
import { icalCalendar } from '../src';
import { describe, afterEach, it } from 'mocha';

const sinon = require('sinon');
use(require('chai-like'));
use(require('chai-things'));

describe('getEvents', () => {
  afterEach(function () {
    sinon.restore();
  });

  it('finds all events', async () => {
    const cal = new icalCalendar({
      url: './test/mocks/events.ics',
    });
    const events = await cal.getEvents({
      now: moment('20111123').toDate(),
    });
    expect(events).to.have.lengthOf(16);
  });

  it('finds all events', async () => {
    const cal = new icalCalendar({
      url: './test/mocks/events.ics',
    });
    const events = await cal.getEvents({
      now: moment('20111123').toDate(),
    });
    expect(events).to.have.lengthOf(16);
  });
});
