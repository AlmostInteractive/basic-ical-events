import { expect, use } from 'chai';
import moment = require('moment');
import { icalCalendar } from '../src';
import { describe, afterEach, it } from 'mocha';

const sinon = require('sinon');
use(require('chai-like'));
use(require('chai-things'));

const ICS_URL = './test/mocks/recurranceid.ics';

describe('recurrence', () => {
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
    expect(events).to.have.lengthOf(8);
  });
});
