import { DateUtil } from './date.util';

describe('DateUtil', () => {
  describe('getDays', () => {
    it('should return an array of next 2 days date', () => {
      const result = DateUtil.getDays(2);
      expect(result).toEqual([
        new Date('2023-11-12T03:00:00.000Z'),
        new Date('2023-11-13T03:00:00.000Z')
      ]);
    });
  });
});
