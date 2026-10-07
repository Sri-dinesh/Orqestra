import type { TimetableEntry } from '../models';

/**
 * Fast occupancy indexes with explicit reversible mutation (§76 rollback requirement).
 * Keys are `${sectionId}` / `${facultyId}`; inner map key is `${day}:${period}`.
 */
export class OccupancyIndex {
  readonly sectionOccupancy = new Map<string, Map<string, string>>();
  readonly facultyOccupancy = new Map<string, Map<string, string>>();
  readonly roomOccupancy = new Map<string, Map<string, string>>();
  readonly subjectSessionCounts = new Map<string, number>();

  private key(dayIndex: number, period: number): string {
    return `${dayIndex}:${period}`;
  }

  isSectionFree(sectionId: string, dayIndex: number, periods: number[]): boolean {
    const day = this.sectionOccupancy.get(sectionId);
    if (!day) return true;
    return periods.every((p) => !day.has(this.key(dayIndex, p)));
  }

  isFacultyFree(facultyId: string, dayIndex: number, periods: number[]): boolean {
    const day = this.facultyOccupancy.get(facultyId);
    if (!day) return true;
    return periods.every((p) => !day.has(this.key(dayIndex, p)));
  }

  isRoomFree(roomId: string, dayIndex: number, periods: number[]): boolean {
    const day = this.roomOccupancy.get(roomId);
    if (!day) return true;
    return periods.every((p) => !day.has(this.key(dayIndex, p)));
  }

  /** Apply an entry's full occupied range. Returns a rollback closure. */
  apply(entry: TimetableEntry): () => void {
    const occupied: Array<{ map: Map<string, Map<string, string>>; id: string; k: string }> = [];
    for (let p = entry.startPeriod; p < entry.startPeriod + entry.durationPeriods; p++) {
      const k = this.key(entry.dayIndex, p);
      this.getOrCreate(this.sectionOccupancy, entry.sectionId).set(k, entry.id);
      occupied.push({ map: this.sectionOccupancy, id: entry.sectionId, k });
      this.getOrCreate(this.facultyOccupancy, entry.facultyId).set(k, entry.id);
      occupied.push({ map: this.facultyOccupancy, id: entry.facultyId, k });
      if (entry.roomId) {
        this.getOrCreate(this.roomOccupancy, entry.roomId).set(k, entry.id);
        occupied.push({ map: this.roomOccupancy, id: entry.roomId, k });
      }
    }
    const countKey = `${entry.sectionId}:${entry.subjectId}`;
    this.subjectSessionCounts.set(countKey, (this.subjectSessionCounts.get(countKey) ?? 0) + 1);

    return () => {
      for (const o of occupied) {
        const day = o.map.get(o.id);
        if (day) {
          day.delete(o.k);
          if (day.size === 0) o.map.delete(o.id);
        }
      }
      const current = this.subjectSessionCounts.get(countKey) ?? 0;
      if (current <= 1) this.subjectSessionCounts.delete(countKey);
      else this.subjectSessionCounts.set(countKey, current - 1);
    };
  }

  private getOrCreate(
    map: Map<string, Map<string, string>>,
    id: string,
  ): Map<string, string> {
    let day = map.get(id);
    if (!day) {
      day = new Map();
      map.set(id, day);
    }
    return day;
  }
}
