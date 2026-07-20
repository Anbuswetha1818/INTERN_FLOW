import React from 'react';

export function ResponsiveGridExample() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">Card 1</div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">Card 2</div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">Card 3</div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">Card 4</div>
    </div>
  );
}

export function ResponsiveTableExample() {
  return (
    <>
      {/* Desktop/tablet: real table */}
      <table className="hidden w-full text-sm md:table">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-slate-100">
            <td className="px-4 py-3">Intern Name</td>
            <td className="px-4 py-3">Active</td>
          </tr>
        </tbody>
      </table>

      {/* Mobile: stacked cards */}
      <div className="space-y-3 md:hidden">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="font-medium text-slate-800">Intern Name</p>
          <p className="text-sm text-slate-500">Active</p>
        </div>
      </div>
    </>
  );
}
