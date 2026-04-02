import { useState, useEffect, useCallback } from 'react';
import {
  useBusinessHours,
  useUpdateBusinessHours,
  useHolidays,
  useCreateHoliday,
  useDeleteHoliday,
  useDelegates,
  useCreateDelegate,
  useDeleteDelegate,
} from '@/api/hooks/useAdmin';
import type { BusinessHourDay, Holiday, Delegate } from '@/api/endpoints/admin';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BusinessHours() {
  // --- Data fetching ---
  const { data: businessHoursData, isLoading: bhLoading } = useBusinessHours();
  const updateBusinessHours = useUpdateBusinessHours();
  const { data: holidays, isLoading: holLoading } = useHolidays();
  const createHoliday = useCreateHoliday();
  const removeHoliday = useDeleteHoliday();
  const { data: delegates, isLoading: delLoading } = useDelegates();
  const createDelegate = useCreateDelegate();
  const removeDelegate = useDeleteDelegate();

  // --- Local state for business hours form ---
  const [activeDays, setActiveDays] = useState<Record<string, boolean>>(
    Object.fromEntries(DAY_LABELS.map((d) => [d, false]))
  );
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');

  // Sync API data into local state
  useEffect(() => {
    if (businessHoursData?.days) {
      const dayMap: Record<string, boolean> = {};
      let start = '08:00';
      let end = '17:00';
      businessHoursData.days.forEach((d: BusinessHourDay) => {
        const label = DAY_LABELS[d.dayOfWeek];
        if (label) dayMap[label] = d.isWorkingDay;
        if (d.isWorkingDay && d.startTime) start = d.startTime;
        if (d.isWorkingDay && d.endTime) end = d.endTime;
      });
      setActiveDays(dayMap);
      setStartTime(start);
      setEndTime(end);
    }
  }, [businessHoursData]);

  const toggleDay = (label: string) => {
    setActiveDays((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleSaveBusinessHours = useCallback(() => {
    if (!businessHoursData?.days) return;
    const payload = {
      days: businessHoursData.days.map((d: BusinessHourDay) => ({
        id: d.id,
        isWorkingDay: activeDays[DAY_LABELS[d.dayOfWeek]] ?? false,
        startTime,
        endTime,
      })),
    };
    updateBusinessHours.mutate(payload);
  }, [businessHoursData, activeDays, startTime, endTime, updateBusinessHours]);

  // --- Holiday form state ---
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  const handleAddHoliday = () => {
    if (!newHolidayDate || !newHolidayName.trim()) return;
    createHoliday.mutate(
      { date: newHolidayDate, name: newHolidayName.trim() },
      {
        onSuccess: () => {
          setNewHolidayDate('');
          setNewHolidayName('');
          setShowHolidayForm(false);
        },
      },
    );
  };

  // --- Delegate form state ---
  const [showDelegateForm, setShowDelegateForm] = useState(false);
  const [newPrimaryUserId, setNewPrimaryUserId] = useState('');
  const [newDelegateUserId, setNewDelegateUserId] = useState('');
  const [newValidFrom, setNewValidFrom] = useState('');
  const [newValidTo, setNewValidTo] = useState('');

  const handleAddDelegate = () => {
    if (!newPrimaryUserId || !newDelegateUserId) return;
    createDelegate.mutate(
      {
        primaryUserId: newPrimaryUserId,
        delegateUserId: newDelegateUserId,
        validFrom: newValidFrom || null,
        validTo: newValidTo || null,
      },
      {
        onSuccess: () => {
          setNewPrimaryUserId('');
          setNewDelegateUserId('');
          setNewValidFrom('');
          setNewValidTo('');
          setShowDelegateForm(false);
        },
      },
    );
  };

  const isLoading = bhLoading || holLoading || delLoading;

  if (isLoading) {
    return (
      <main className="flex-grow max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-surface-container-low rounded w-1/3" />
          <div className="grid grid-cols-2 gap-8">
            <div className="h-96 bg-surface-container-low rounded-xl" />
            <div className="h-96 bg-surface-container-low rounded-xl" />
          </div>
          <div className="h-48 bg-surface-container-low rounded-xl" />
        </div>
      </main>
    );
  }

  // Format holiday for display
  const formatHoliday = (h: Holiday) => {
    const d = new Date(h.date);
    return {
      month: d.toLocaleString('en-US', { month: 'short' }),
      day: String(d.getDate()).padStart(2, '0'),
    };
  };

  // Format delegate initials
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  // Format delegate period
  const formatPeriod = (from: string | null, to: string | null) => {
    if (!from && !to) return 'Open-ended';
    const f = from ? new Date(from).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';
    const t = to ? new Date(to).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Ongoing';
    return `${f} — ${t}`;
  };

  return (
    <main className="flex-grow max-w-7xl mx-auto">
      {/* Background decorations */}
      <div className="fixed top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary-fixed opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-tertiary-fixed opacity-10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Page Header */}
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2">
          Business Hours &amp; Holidays
        </h1>
        <p className="text-on-surface-variant font-medium opacity-70">
          Configure global operational windows and automated holiday response cycles.
        </p>
      </header>

      {/* Two-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Left Card: Weekly Schedule */}
        <section className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_10px_40px_rgba(23,29,28,0.04)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">work</span>
              <h2 className="text-xl font-bold text-on-surface">Weekly Schedule</h2>
            </div>
            <span className="bg-surface-container-high px-3 py-1 rounded-full text-xs font-bold text-on-surface-variant tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">public</span>
              GST UTC+4
            </span>
          </div>

          <div className="space-y-6">
            {/* Day toggles */}
            <div className="grid grid-cols-1 gap-4">
              <label className="text-xs font-bold text-secondary uppercase tracking-widest">
                Active Working Days
              </label>
              <div className="flex flex-wrap gap-2">
                {DAY_LABELS.map((day) => (
                  <label key={day} className="group cursor-pointer">
                    <input
                      type="checkbox"
                      className="hidden peer"
                      checked={activeDays[day] ?? false}
                      onChange={() => toggleDay(day)}
                    />
                    <div
                      className={`px-4 py-2 rounded-lg bg-surface-container-low text-secondary peer-checked:bg-primary peer-checked:text-white transition-all duration-200 font-bold text-sm${!activeDays[day] ? ' opacity-50' : ''}`}
                    >
                      {day}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Time inputs */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest">
                  Shift Starts
                </label>
                <div className="flex items-center bg-surface-container-low p-4 rounded-lg focus-within:bg-white transition-colors">
                  <span className="material-symbols-outlined text-outline mr-3">schedule</span>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 w-full font-bold text-lg"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-widest">
                  Shift Ends
                </label>
                <div className="flex items-center bg-surface-container-low p-4 rounded-lg focus-within:bg-white transition-colors">
                  <span className="material-symbols-outlined text-outline mr-3">history</span>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 w-full font-bold text-lg"
                  />
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="pt-6">
              <button
                onClick={handleSaveBusinessHours}
                disabled={updateBusinessHours.isPending}
                className="bg-primary-gradient text-white font-bold py-4 px-8 rounded-lg w-full shadow-lg active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {updateBusinessHours.isPending ? 'Saving...' : 'Save Operational Hours'}
              </button>
            </div>
          </div>
        </section>

        {/* Right Card: Holiday Calendar */}
        <section className="bg-surface-container-low p-8 rounded-xl shadow-sm border-t-4 border-tertiary-container relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-tertiary-container text-3xl">event</span>
              <h2 className="text-xl font-bold text-on-surface">Holiday Calendar</h2>
            </div>
            <div className="bg-surface-container-highest px-4 py-2 rounded-lg flex items-center gap-2">
              <span className="text-sm font-bold">{new Date().getFullYear()}</span>
            </div>
          </div>

          {/* Holiday list */}
          <div className="space-y-3 mb-8 max-h-[280px] overflow-y-auto pr-2">
            {holidays && holidays.length > 0 ? (
              holidays.map((holiday: Holiday) => {
                const fmt = formatHoliday(holiday);
                return (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-lg group hover:translate-x-1 transition-transform"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 text-center bg-tertiary-fixed rounded-lg p-2">
                        <p className="text-[10px] uppercase font-black text-on-tertiary-fixed-variant">
                          {fmt.month}
                        </p>
                        <p className="text-lg font-bold text-on-tertiary-fixed leading-tight">
                          {fmt.day}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{holiday.name}</p>
                        <p className="text-xs text-secondary">{holiday.date}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeHoliday.mutate(holiday.id)}
                      disabled={removeHoliday.isPending}
                      className="text-outline opacity-0 group-hover:opacity-100 transition-opacity hover:text-error disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-on-surface-variant text-sm py-8">
                No holidays configured.
              </div>
            )}
          </div>

          {/* Add holiday form / button */}
          {showHolidayForm ? (
            <div className="space-y-3 p-4 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
              <input
                type="text"
                placeholder="Holiday name"
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border-none text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
              <input
                type="date"
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border-none text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddHoliday}
                  disabled={createHoliday.isPending}
                  className="flex-1 py-2 rounded-lg bg-primary text-white font-bold text-sm disabled:opacity-50"
                >
                  {createHoliday.isPending ? 'Adding...' : 'Add'}
                </button>
                <button
                  onClick={() => setShowHolidayForm(false)}
                  className="flex-1 py-2 rounded-lg border border-outline-variant font-bold text-sm text-on-surface-variant"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowHolidayForm(true)}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-lg border-2 border-dashed border-outline-variant text-secondary font-bold hover:bg-surface-container-highest transition-colors"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Add New Holiday
            </button>
          )}
        </section>
      </div>

      {/* Delegate Approvers table */}
      <section className="bg-surface-container-highest rounded-xl overflow-hidden shadow-sm">
        <div className="p-8 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-on-surface mb-1">Delegate Approvers</h2>
            <p className="text-sm text-on-surface-variant">
              Manage temporary approval delegation for out-of-office scenarios.
            </p>
          </div>
          <button
            onClick={() => setShowDelegateForm(true)}
            className="bg-surface-container-lowest px-6 py-2.5 rounded-lg font-bold text-primary shadow-sm hover:bg-primary hover:text-white transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            New Delegate
          </button>
        </div>

        {/* Delegate creation form */}
        {showDelegateForm && (
          <div className="px-8 pb-4">
            <div className="p-4 bg-surface-container-lowest rounded-lg border border-outline-variant/20 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Primary User ID"
                  value={newPrimaryUserId}
                  onChange={(e) => setNewPrimaryUserId(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-surface-container-low border-none text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Delegate User ID"
                  value={newDelegateUserId}
                  onChange={(e) => setNewDelegateUserId(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-surface-container-low border-none text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
                <input
                  type="date"
                  placeholder="Valid From"
                  value={newValidFrom}
                  onChange={(e) => setNewValidFrom(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-surface-container-low border-none text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
                <input
                  type="date"
                  placeholder="Valid To"
                  value={newValidTo}
                  onChange={(e) => setNewValidTo(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-surface-container-low border-none text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddDelegate}
                  disabled={createDelegate.isPending}
                  className="px-6 py-2 rounded-lg bg-primary text-white font-bold text-sm disabled:opacity-50"
                >
                  {createDelegate.isPending ? 'Adding...' : 'Add Delegate'}
                </button>
                <button
                  onClick={() => setShowDelegateForm(false)}
                  className="px-6 py-2 rounded-lg border border-outline-variant font-bold text-sm text-on-surface-variant"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto p-4">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase font-black tracking-[0.2em] text-secondary">
                <th className="px-6 py-4">Primary Approver</th>
                <th className="px-6 py-4">Delegate</th>
                <th className="px-6 py-4">Period</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {delegates && delegates.length > 0 ? (
                delegates.map((row: Delegate) => (
                  <tr key={row.id} className="bg-white/40 hover:bg-white/60 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant font-bold text-xs">
                          {getInitials(row.primaryUserName)}
                        </div>
                        <span className="font-bold">{row.primaryUserName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed-variant font-bold text-xs">
                          {getInitials(row.delegateUserName)}
                        </div>
                        <span className="font-bold text-on-surface-variant">{row.delegateUserName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-medium text-on-surface-variant">
                        {formatPeriod(row.validFrom, row.validTo)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => removeDelegate.mutate(row.id)}
                        disabled={removeDelegate.isPending}
                        className="p-2 hover:bg-error-container hover:text-error rounded-lg transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant text-sm">
                    No active delegates.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
