import { useState } from 'react';

const DAYS = [
  { label: 'Sun', defaultChecked: true },
  { label: 'Mon', defaultChecked: true },
  { label: 'Tue', defaultChecked: true },
  { label: 'Wed', defaultChecked: true },
  { label: 'Thu', defaultChecked: true },
  { label: 'Fri', defaultChecked: false },
  { label: 'Sat', defaultChecked: false },
];

const HOLIDAYS = [
  { month: 'Jan', day: '01', name: "New Year's Day", type: 'Global Observance' },
  { month: 'Apr', day: '10', name: 'Eid Al Fitr', type: 'Regional Holiday' },
  { month: 'Jun', day: '16', name: 'Eid Al Adha', type: 'Regional Holiday' },
  { month: 'Jul', day: '07', name: 'Islamic New Year', type: 'Regional Holiday' },
  { month: 'Dec', day: '02', name: 'National Day', type: 'National Holiday' },
  { month: 'Dec', day: '03', name: 'National Day', type: 'National Holiday' },
];

const DELEGATES = [
  {
    primaryInitials: 'SM',
    primaryName: 'Sarah Miller',
    primaryBg: 'bg-primary-fixed',
    primaryText: 'text-on-primary-fixed-variant',
    delegateInitials: 'JR',
    delegateName: 'James Ross',
    delegateBg: 'bg-secondary-fixed',
    delegateText: 'text-on-secondary-fixed-variant',
    scopeLabel: 'L2 Infrastructure',
    scopeClass: 'bg-primary-container/20 text-on-primary-container',
    period: '15 Mar — 20 Mar, 2024',
    rowBg: 'bg-white/40',
    rowHover: 'hover:bg-white/60',
  },
  {
    primaryInitials: 'AK',
    primaryName: 'Ahmed Khan',
    primaryBg: 'bg-tertiary-fixed',
    primaryText: 'text-on-tertiary-fixed-variant',
    delegateInitials: 'LC',
    delegateName: 'Linda Chen',
    delegateBg: 'bg-secondary-fixed',
    delegateText: 'text-on-secondary-fixed-variant',
    scopeLabel: 'HR Operations',
    scopeClass: 'bg-tertiary-container/20 text-on-tertiary-container',
    period: '01 Apr — 05 Apr, 2024',
    rowBg: 'bg-white/20',
    rowHover: 'hover:bg-white/40',
  },
];

export default function BusinessHours() {
  const [activeDays, setActiveDays] = useState<Record<string, boolean>>(
    Object.fromEntries(DAYS.map((d) => [d.label, d.defaultChecked]))
  );

  const toggleDay = (label: string) => {
    setActiveDays((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <main className="ml-64 flex-grow px-12 pt-16 pb-24 max-w-7xl mx-auto">
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
                {DAYS.map((day) => (
                  <label key={day.label} className="group cursor-pointer">
                    <input
                      type="checkbox"
                      className="hidden peer"
                      checked={activeDays[day.label]}
                      onChange={() => toggleDay(day.label)}
                    />
                    <div
                      className={`px-4 py-2 rounded-lg bg-surface-container-low text-secondary peer-checked:bg-primary peer-checked:text-white transition-all duration-200 font-bold text-sm${!day.defaultChecked && !activeDays[day.label] ? ' opacity-50' : ''}`}
                    >
                      {day.label}
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
                    defaultValue="08:00"
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
                    defaultValue="17:00"
                    className="bg-transparent border-none focus:ring-0 w-full font-bold text-lg"
                  />
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="pt-6">
              <button className="bg-primary-gradient text-white font-bold py-4 px-8 rounded-lg w-full shadow-lg active:scale-[0.98] transition-transform">
                Save Operational Hours
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
            <div className="bg-surface-container-highest px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-white transition-colors">
              <span className="text-sm font-bold">2024</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </div>
          </div>

          {/* Holiday list */}
          <div className="space-y-3 mb-8 max-h-[280px] overflow-y-auto pr-2">
            {HOLIDAYS.map((holiday, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-lg group hover:translate-x-1 transition-transform"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 text-center bg-tertiary-fixed rounded-lg p-2">
                    <p className="text-[10px] uppercase font-black text-on-tertiary-fixed-variant">
                      {holiday.month}
                    </p>
                    <p className="text-lg font-bold text-on-tertiary-fixed leading-tight">
                      {holiday.day}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{holiday.name}</p>
                    <p className="text-xs text-secondary">{holiday.type}</p>
                  </div>
                </div>
                <button className="text-outline opacity-0 group-hover:opacity-100 transition-opacity hover:text-error">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            ))}
          </div>

          {/* Add holiday button */}
          <button className="flex items-center justify-center gap-2 w-full py-4 rounded-lg border-2 border-dashed border-outline-variant text-secondary font-bold hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined">add_circle</span>
            Add New Holiday
          </button>
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
          <button className="bg-surface-container-lowest px-6 py-2.5 rounded-lg font-bold text-primary shadow-sm hover:bg-primary hover:text-white transition-all active:scale-95 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">person_add</span>
            New Delegate
          </button>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase font-black tracking-[0.2em] text-secondary">
                <th className="px-6 py-4">Primary Approver</th>
                <th className="px-6 py-4">Delegate</th>
                <th className="px-6 py-4">Scope</th>
                <th className="px-6 py-4">Period</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {DELEGATES.map((row, i) => (
                <tr key={i} className={`${row.rowBg} ${row.rowHover} transition-colors`}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full ${row.primaryBg} flex items-center justify-center ${row.primaryText} font-bold text-xs`}
                      >
                        {row.primaryInitials}
                      </div>
                      <span className="font-bold">{row.primaryName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full ${row.delegateBg} flex items-center justify-center ${row.delegateText} font-bold text-xs`}
                      >
                        {row.delegateInitials}
                      </div>
                      <span className="font-bold text-on-surface-variant">{row.delegateName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`${row.scopeClass} px-3 py-1 rounded-full text-xs font-bold`}>
                      {row.scopeLabel}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-medium text-on-surface-variant">{row.period}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 hover:bg-error-container hover:text-error rounded-lg transition-colors">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
