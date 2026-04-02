export default function SlaSettings() {
  const products = [
    { name: "Rabet", subtitle: "Logistics & Supply Chain", icon: "rocket_launch" },
    { name: "Rhoon", subtitle: "Financial Settlements", icon: "payments" },
    { name: "Wtheeq", subtitle: "Identity Verification", icon: "shield_person" },
    { name: "Mulem", subtitle: "Infrastructure Mesh", icon: "hub" },
  ];

  const slaTargets = [
    { taskId: "T-01", stage: "Legal Review", category: "Agreement", hours: "8.0", trigger: 75, barColor: "bg-primary" },
    { taskId: "T-01", stage: "EA Sign-off", category: "Approval", hours: "4.0", trigger: 90, barColor: "bg-primary" },
    { taskId: "T-02", stage: "UAT Access Creation", category: "Provisioning", hours: "16.0", trigger: 50, barColor: "bg-tertiary" },
    { taskId: "T-03", stage: "Integration Review", category: "Technical", hours: "8.0", trigger: 80, barColor: "bg-primary" },
    { taskId: "T-03", stage: "Account Provisioning", category: "Production", hours: "24.0", trigger: 75, barColor: "bg-primary" },
    { taskId: "T-04", stage: "Support Triage", category: "Closure", hours: "4.0", trigger: 95, barColor: "bg-primary" },
    { taskId: "T-04", stage: "Access Provisioning", category: "Credential", hours: "16.0", trigger: 90, barColor: "bg-primary" },
  ];

  return (
    <main className="max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">
            <span>Admin</span>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-primary font-bold">Settings</span>
          </nav>
          <h1 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight">SLA Settings</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-surface-container-low px-4 py-2 rounded-full flex items-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-48"
              placeholder="Search parameters..."
              type="text"
              readOnly
            />
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">help</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-primary">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Global Compliance */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-none flex flex-col justify-between">
          <div>
            <p className="text-xs font-label uppercase tracking-widest text-secondary mb-1">Global Compliance</p>
            <h3 className="text-3xl font-headline font-bold text-on-surface">
              98.2<span className="text-lg font-medium text-secondary">%</span>
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-1 bg-teal-50 text-teal-700 rounded-full">+2.4%</span>
            <span className="text-[10px] text-on-surface-variant">vs last month</span>
          </div>
        </div>

        {/* Breached Today */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-none flex flex-col justify-between">
          <div>
            <p className="text-xs font-label uppercase tracking-widest text-secondary mb-1">Breached Today</p>
            <h3 className="text-3xl font-headline font-bold text-error">12</h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-1 bg-error-container text-on-error-container rounded-full">+4 new</span>
            <span className="text-[10px] text-on-surface-variant">since 08:00 AM</span>
          </div>
        </div>

        {/* At Risk */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-none flex flex-col justify-between">
          <div>
            <p className="text-xs font-label uppercase tracking-widest text-secondary mb-1">At Risk</p>
            <h3 className="text-3xl font-headline font-bold text-tertiary">47</h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-1 bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-full">High Alert</span>
            <span className="text-[10px] text-on-surface-variant">next 2 hours</span>
          </div>
        </div>

        {/* Active SLAs */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-none flex flex-col justify-between">
          <div>
            <p className="text-xs font-label uppercase tracking-widest text-secondary mb-1">Active SLAs</p>
            <h3 className="text-3xl font-headline font-bold text-primary">3,892</h3>
          </div>
          <div className="mt-4 flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">bolt</span>
            <span className="text-[10px]">Processing in real-time</span>
          </div>
        </div>
      </section>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Portfolios */}
        <section className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-headline font-bold text-on-surface">Product Portfolios</h2>
            <span className="text-xs text-primary font-bold">4 Products</span>
          </div>
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product.name}
                className="bg-surface-container-lowest p-5 rounded-xl transition-all duration-300 group hover:shadow-lg"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {product.icon}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface">{product.name}</h4>
                    <p className="text-xs text-on-surface-variant">{product.subtitle}</p>
                  </div>
                </div>
                <button className="w-full py-2.5 rounded-lg bg-surface-container-high group-hover:bg-primary-container group-hover:text-white transition-all font-medium text-sm flex items-center justify-center gap-2">
                  Manage SLAs
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Default SLA Targets Table */}
        <section className="lg:col-span-2">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-8 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-headline font-bold text-on-surface">Default SLA Targets</h2>
                <button className="flex items-center gap-2 text-sm font-bold text-primary hover:bg-teal-50 px-3 py-1.5 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  New Target
                </button>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                System-wide fallback metrics applied when no product-specific overrides are defined. Changes here affect all ongoing operations immediately.
              </p>
            </div>
            <div className="px-8 pb-8 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-label uppercase tracking-[0.1em] text-secondary">
                    <th className="py-4 font-semibold">Task ID</th>
                    <th className="py-4 font-semibold">Stage</th>
                    <th className="py-4 font-semibold">Target Time</th>
                    <th className="py-4 font-semibold">Trigger (%)</th>
                    <th className="py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {slaTargets.map((row, idx) => (
                    <tr key={idx} className="group hover:bg-surface-container-low transition-colors">
                      <td className="py-5">
                        <span className="px-2 py-1 bg-surface-container rounded font-mono text-xs font-bold text-on-surface">
                          {row.taskId}
                        </span>
                      </td>
                      <td className="py-5">
                        <p className="text-sm font-medium text-on-surface">{row.stage}</p>
                        <p className="text-[10px] text-on-surface-variant uppercase">{row.category}</p>
                      </td>
                      <td className="py-5">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-on-surface-variant">schedule</span>
                          <span className="text-sm font-bold">
                            {row.hours} <span className="font-normal text-on-surface-variant">hrs</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                            <div className={`h-full ${row.barColor}`} style={{ width: `${row.trigger}%` }} />
                          </div>
                          <span className="text-xs font-bold text-on-surface">{row.trigger}%</span>
                        </div>
                      </td>
                      <td className="py-5 text-right">
                        <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
                          more_vert
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Performance Threshold Footer */}
      <footer className="mt-12 bg-gradient-to-r from-primary to-primary-container p-1 rounded-xl shadow-xl shadow-teal-900/10">
        <div className="bg-surface-container-lowest/90 backdrop-blur-md p-6 rounded-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center text-on-error-container">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <div>
              <h4 className="font-bold text-on-surface">System Performance Threshold</h4>
              <p className="text-sm text-on-surface-variant">
                Current SLA load is at 84% capacity. Consider scaling Ops Nodes if compliance drops below 95%.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-6 py-2.5 rounded-lg border border-outline-variant font-bold text-sm text-on-surface hover:bg-surface-container-low transition-colors">
              View Node Status
            </button>
            <button className="flex-1 md:flex-none px-6 py-2.5 rounded-lg bg-primary text-white font-bold text-sm shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform">
              Optimise Queue
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
