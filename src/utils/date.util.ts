export class DateUtil {
  public static getDays(startAt: Date, number: number): Date[] {
    const daysArray: Date[] = [];

    for (let i = 0; i < number; i++) {
      const newDate = new Date(
        startAt.getFullYear(),
        startAt.getMonth(),
        startAt.getDate() + i,
        0,
        0,
        0
      );
      daysArray.push(newDate);
    }

    return daysArray;
  }
}
