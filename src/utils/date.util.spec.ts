import { DateUtil } from './date.util';

describe('DateUtil', () => {
  describe('getDays', () => {
    test('should return the next 3 dates', () => {
      const result = DateUtil.getDays(new Date('2020-10-10T00:00:00'), 3);

      expect(result).toEqual([
        new Date('2020-10-10T00:00:00'),
        new Date('2020-10-11T00:00:00'),
        new Date('2020-10-12T00:00:00')
      ]);
    });
  });
});
