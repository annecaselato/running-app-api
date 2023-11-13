export class DateUtil {
  public static getDays(number: number): Date[] {
    const now = new Date();

    const daysArray: Date[] = [];

    for (let i = 0; i < number; i++) {
      const newDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + i,
        0,
        0,
        0
      );
      daysArray.push(newDate);
    }

    return daysArray;
  }
}
