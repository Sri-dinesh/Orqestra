import { Button, EditModal, Field, Input } from '@/components/ui/primitives';
import type { Timetable } from '@/domain/models';

export function TimetableDetailsModal({
  timetable,
  onClose,
  onSave,
}: {
  timetable: Timetable;
  onClose: () => void;
  onSave: (details: { name: string; description: string }) => void;
}) {
  return (
    <EditModal
      title="Edit timetable details"
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget as HTMLFormElement);
        const name = String(form.get('name') ?? '').trim();
        const description = String(form.get('description') ?? '').trim();
        if (!name) return;
        onSave({ name, description });
      }}
    >
      <div className="grid gap-4">
        <Field label="Timetable name" hint="Use a name people can recognize, such as 3rd Year — Odd Semester.">
          <Input name="name" defaultValue={timetable.name ?? 'Untitled timetable'} required aria-label="Timetable name" />
        </Field>
        <Field label="Description" hint="Optional notes about the schedule's purpose, cohort, or audience.">
          <Input name="description" defaultValue={timetable.description ?? ''} placeholder="Main classroom schedule" aria-label="Timetable description" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save details</Button>
        </div>
      </div>
    </EditModal>
  );
}
