import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  FileSpreadsheet,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  FlaskConical,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import {
  Button,
  Card,
  EditModal,
  Field,
  Input,
  PageHeader,
  Select,
  StatTile,
} from '@/components/ui/primitives';
import { DepartmentNav } from '@/components/ui/DepartmentNav';
import { DepartmentNotFound } from '@/components/ui/DepartmentNotFound';
import { BulkImportModal } from '@/components/ui/BulkImportModal';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { useEditorStore } from '@/state/stores/editor-store';
import type { SubjectType } from '@/domain/enums';

interface RoomFormState {
  code: string;
  name: string;
  capacity: number;
  type: SubjectType | 'GENERAL';
}

const DEFAULT_CAMPUS_PRESETS: RoomFormState[] = [
  { code: 'LH-101', name: 'Lecture Hall 101', capacity: 60, type: 'GENERAL' },
  { code: 'LH-102', name: 'Lecture Hall 102', capacity: 60, type: 'THEORY' },
  { code: 'LH-103', name: 'Lecture Hall 103', capacity: 60, type: 'THEORY' },
  { code: 'LAB-CS1', name: 'Advanced Computing & Networks Lab', capacity: 40, type: 'LAB' },
  { code: 'LAB-AI', name: 'Artificial Intelligence & Data Systems Lab', capacity: 35, type: 'LAB' },
  { code: 'LAB-IOT', name: 'Hardware & Embedded IoT Lab', capacity: 35, type: 'LAB' },
  { code: 'AUD-01', name: 'Main Seminar Auditorium', capacity: 120, type: 'GENERAL' },
];

export function RoomsPage() {
  const { departmentId } = useParams();
  const state = useWorkspaceStore();
  const showToast = useEditorStore((s) => s.showToast);

  const department = state.departments.find((d) => d.id === departmentId);
  const rooms = state.rooms.filter((r) => r.departmentId === departmentId);
  const timetable = state.timetables.find((t) => t.departmentId === departmentId);

  // Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'GENERAL' | 'THEORY' | 'LAB'>('ALL');

  const [form, setForm] = useState<RoomFormState>({
    code: '',
    name: '',
    capacity: 60,
    type: 'GENERAL',
  });

  const editingRoom = editingRoomId ? rooms.find((r) => r.id === editingRoomId) ?? null : null;
  const [editForm, setEditForm] = useState<RoomFormState>({
    code: '',
    name: '',
    capacity: 60,
    type: 'GENERAL',
  });

  // Calculate room occupancy from active timetable
  const roomUsageCount = useMemo(() => {
    const counts = new Map<string, number>();
    if (timetable) {
      for (const entry of timetable.entries) {
        if (entry.roomId) {
          counts.set(entry.roomId, (counts.get(entry.roomId) ?? 0) + entry.durationPeriods);
        }
      }
    }
    return counts;
  }, [timetable]);

  if (!department || !departmentId) {
    return <DepartmentNotFound requestedId={departmentId} targetPage="rooms" />;
  }

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();
    if (!code || !name) return;

    if (rooms.some((r) => r.code === code)) {
      showToast('error', `Room code "${code}" already exists in this department.`);
      return;
    }

    state.addRoom({
      departmentId,
      code,
      name,
      capacity: Math.max(1, form.capacity),
      type: form.type,
    });
    showToast('success', `Room ${code} added successfully.`);
    setForm({ code: '', name: '', capacity: 60, type: 'GENERAL' });
    setShowAddModal(false);
  };

  const handleUpdateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoomId) return;
    const code = editForm.code.trim().toUpperCase();
    const name = editForm.name.trim();
    if (!code || !name) return;

    if (rooms.some((r) => r.id !== editingRoomId && r.code === code)) {
      showToast('error', `Room code "${code}" already taken by another space.`);
      return;
    }

    state.updateRoom(editingRoomId, {
      code,
      name,
      capacity: Math.max(1, editForm.capacity),
      type: editForm.type,
    });
    showToast('success', `Room ${code} updated.`);
    setEditingRoomId(null);
  };

  const handlePopulatePresets = () => {
    let added = 0;
    for (const preset of DEFAULT_CAMPUS_PRESETS) {
      if (!rooms.some((r) => r.code === preset.code)) {
        state.addRoom({
          departmentId,
          code: preset.code,
          name: preset.name,
          capacity: preset.capacity,
          type: preset.type,
        });
        added++;
      }
    }
    showToast('success', `Added ${added} standard campus rooms & laboratories.`);
  };

  const handleBulkImport = (items: any[]) => {
    let added = 0;
    for (const item of items) {
      if (rooms.some((r) => r.code === item.code)) continue;
      state.addRoom({
        departmentId,
        code: item.code,
        name: item.name,
        capacity: item.capacity || 60,
        type: item.type || 'GENERAL',
      });
      added++;
    }
    showToast('success', `Imported ${added} rooms and laboratories successfully.`);
  };

  const filteredRooms = rooms.filter((r) => {
    if (filterType === 'ALL') return true;
    return r.type === filterType;
  });

  const totalCapacity = rooms.reduce((acc, r) => acc + (r.active ? r.capacity : 0), 0);
  const labCount = rooms.filter((r) => r.type === 'LAB').length;
  const theoryCount = rooms.filter((r) => r.type === 'THEORY' || r.type === 'GENERAL').length;

  return (
    <div className="space-y-6">
      <DepartmentNav />

      <PageHeader
        eyebrow="INFRASTRUCTURE & PHYSICAL ASSETS"
        title={`${department.code} — Rooms & Laboratories`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setImportModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#0047FF]" />
              <span>Bulk Import (Excel/CSV)</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Room</span>
            </Button>
          </div>
        }
      />

      {/* Metric Tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total Facilities"
          value={rooms.length}
          accent="blue"
        />
        <StatTile
          label="Laboratories (Hardware / Computer)"
          value={labCount}
          accent="lilac"
        />
        <StatTile
          label="Lecture Classrooms"
          value={theoryCount}
          accent="green"
        />
        <StatTile
          label="Active Seating Capacity"
          value={`${totalCapacity} seats`}
          accent="coral"
        />
      </div>

      {/* Quick Setup Presets Callout if few rooms exist */}
      {rooms.length === 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#111315] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0047FF]" />
              <span>Instant Infrastructure Setup</span>
            </h3>
            <p className="text-xs text-[#4B5259]">
              Populate this department with a standard engineering suite: Lecture Halls, Computer Networks Lab, AI/Data Lab, Hardware IoT Lab, and Seminar Auditorium.
            </p>
          </div>
          <Button onClick={handlePopulatePresets} className="whitespace-nowrap shrink-0">
            Populate Standard Campus Suite
          </Button>
        </div>
      )}

      {/* Main Table / Grid */}
      <Card
        title={`Classrooms & Laboratories (${filteredRooms.length})`}
        actions={
          <div className="flex items-center gap-1 bg-[#F0F2EB] p-1 rounded-xl">
            {(['ALL', 'LAB', 'THEORY', 'GENERAL'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  filterType === t
                    ? 'bg-white text-[#111315] shadow-xs'
                    : 'text-[#71767B] hover:text-[#111315]'
                }`}
              >
                {t === 'ALL' ? 'All Spaces' : t === 'LAB' ? 'Labs' : t === 'THEORY' ? 'Theory Halls' : 'General'}
              </button>
            ))}
          </div>
        }
      >
        {filteredRooms.length === 0 ? (
          <div className="py-12 text-center text-[#71767B] space-y-3">
            <Building2 className="w-10 h-10 mx-auto text-[#71767B]/40" />
            <p className="text-sm font-medium text-[#111315]">No rooms found for this filter</p>
            <p className="text-xs">Add a room or import using an Excel template to assign physical spaces to timetable slots.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAFBF9] border-b border-[#E5E8E0] text-xs font-bold text-[#4B5259] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Room Code</th>
                  <th className="py-3 px-4">Facility Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Weekly Occupancy</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E8E0]">
                {filteredRooms.map((room) => {
                  const usagePeriods = roomUsageCount.get(room.id) ?? 0;
                  return (
                    <tr key={room.id} className="hover:bg-[#FAFBF9]/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#111315]">
                        {room.code}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#111315]">
                        <div className="flex items-center gap-2">
                          {room.type === 'LAB' ? (
                            <FlaskConical className="w-4 h-4 text-purple-600 shrink-0" />
                          ) : (
                            <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                          <span>{room.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            room.type === 'LAB'
                              ? 'bg-purple-100 text-purple-700'
                              : room.type === 'THEORY'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {room.type === 'LAB' ? 'Laboratory' : room.type === 'THEORY' ? 'Theory Hall' : 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#333]">
                        {room.capacity} seats
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-semibold ${
                            usagePeriods > 0 ? 'text-[#0047FF]' : 'text-[#71767B]'
                          }`}
                        >
                          {usagePeriods > 0 ? `${usagePeriods} periods scheduled` : 'Idle / Unassigned'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => state.updateRoom(room.id, { active: !room.active })}
                          className={`inline-flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                            room.active ? 'text-emerald-700' : 'text-gray-400'
                          }`}
                        >
                          {room.active ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{room.active ? 'Operational' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRoomId(room.id);
                              setEditForm({
                                code: room.code,
                                name: room.name,
                                capacity: room.capacity,
                                type: room.type,
                              });
                            }}
                            className="p-1.5 rounded-lg text-[#71767B] hover:text-[#111315] hover:bg-black/5"
                            title="Edit Room"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove room ${room.code} (${room.name})?`)) {
                                state.removeRoom(room.id);
                                showToast('success', `Room ${room.code} deleted.`);
                              }
                            }}
                            className="p-1.5 rounded-lg text-[#71767B] hover:text-red-600 hover:bg-red-50"
                            title="Delete Room"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Guided Bottom Navigation Flow */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link to={`/departments/${departmentId}/faculty`}>
          <Button variant="secondary">
            ← Step 3: Faculty
          </Button>
        </Link>
        <Link to={`/departments/${departmentId}/generate`}>
          <Button>
            Next Step: Generate Timetable →
          </Button>
        </Link>
      </div>

      {/* Add Room Modal */}
      {showAddModal && (
        <EditModal
          title="Add New Room or Laboratory"
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreateRoom}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Room Code" hint="E.g. LH-201, LAB-AI, SEM-1">
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
                placeholder="LH-201"
                className="font-mono"
              />
            </Field>
            <Field label="Facility Name" hint="Full descriptive name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Advanced Networks Lab"
              />
            </Field>
            <Field label="Facility Type">
              <Select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
              >
                <option value="GENERAL">General Purpose (Any Section/Subject)</option>
                <option value="THEORY">Theory Classroom</option>
                <option value="LAB">Computer / Hardware Laboratory</option>
              </Select>
            </Field>
            <Field label="Seating / Station Capacity">
              <Input
                type="number"
                min={1}
                max={500}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                required
                className="font-mono"
              />
            </Field>
            <div className="flex gap-2 sm:col-span-2 pt-2">
              <Button type="submit">Create Facility</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </EditModal>
      )}

      {/* Edit Room Modal */}
      {editingRoomId && (
        <EditModal
          title={`Edit Room: ${editingRoom?.code ?? ''}`}
          onClose={() => setEditingRoomId(null)}
          onSubmit={handleUpdateRoom}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Room Code">
              <Input
                value={editForm.code}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                required
                className="font-mono"
              />
            </Field>
            <Field label="Facility Name">
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </Field>
            <Field label="Facility Type">
              <Select
                value={editForm.type}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value as any })}
              >
                <option value="GENERAL">General Purpose</option>
                <option value="THEORY">Theory Classroom</option>
                <option value="LAB">Laboratory</option>
              </Select>
            </Field>
            <Field label="Capacity">
              <Input
                type="number"
                min={1}
                max={500}
                value={editForm.capacity}
                onChange={(e) => setEditForm({ ...editForm, capacity: Number(e.target.value) })}
                required
                className="font-mono"
              />
            </Field>
            <div className="flex gap-2 sm:col-span-2 pt-2">
              <Button type="submit">Save Changes</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingRoomId(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </EditModal>
      )}

      {/* Bulk Ingestion Modal */}
      <BulkImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        type="ROOMS"
        departmentId={departmentId}
        onImport={handleBulkImport}
      />
    </div>
  );
}
