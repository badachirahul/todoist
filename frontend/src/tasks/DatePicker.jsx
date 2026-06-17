import { useState } from "react";
import { CalendarDays, Sun, Armchair, ArrowRight, Ban, Clock, Repeat } from "lucide-react";
import Popover from "../components/Popover";

const RED = "#dc4c3e";
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const sameDay = (a, b) => a && b && iso(a) === iso(b);
const shortWeekday = (d) => d.toLocaleDateString("en-GB", { weekday: "short" });
const shortDate = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function quickDates() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dow = today.getDay(); // 0=Sun..6=Sat
  const weekend = addDays(today, (6 - dow + 7) % 7);
  const nextMon = addDays(today, ((1 - dow + 7) % 7) || 7);
  return [
    { label: "Today", hint: shortWeekday(today), date: today, icon: CalendarDays, color: "#058527" },
    { label: "Tomorrow", hint: shortWeekday(addDays(today, 1)), date: addDays(today, 1), icon: Sun, color: "#ad6200" },
    { label: "This weekend", hint: shortWeekday(weekend), date: weekend, icon: Armchair, color: "#246fe0" },
    { label: "Next week", hint: shortDate(nextMon), date: nextMon, icon: ArrowRight, color: "#692fc2" },
  ];
}

function MonthGrid({ selected, onPick }) {
  const [view, setView] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const year = view.getFullYear();
  const month = view.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first offset
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1))];

  return (
    <div className="px-3 py-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">
          {view.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </span>
        <div className="flex gap-1">
          <button type="button" onClick={() => setView(new Date(year, month - 1, 1))} className="rounded px-1.5 text-gray-500 hover:bg-gray-100">‹</button>
          <button type="button" onClick={() => setView(new Date(year, month + 1, 1))} className="rounded px-1.5 text-gray-500 hover:bg-gray-100">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs text-gray-400">
        {WEEKDAYS.map((w, i) => <div key={i}>{w}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-y-1 text-center text-sm">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const isToday = sameDay(d, today);
          const isSel = sameDay(d, selected);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPick(d)}
              className="mx-auto flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100"
              style={isSel ? { backgroundColor: RED, color: "#fff" } : isToday ? { color: RED, fontWeight: 700 } : {}}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DatePicker({ value, onChange, trigger: customTrigger, align = "left" }) {
  const selectedDate = value ? new Date(value + "T00:00:00") : null;

  const trigger = customTrigger ?? (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
    >
      <CalendarDays size={16} className="text-gray-500" />
      {selectedDate ? shortDate(selectedDate) : "Date"}
    </button>
  );

  return (
    <Popover trigger={trigger} align={align} className="w-72">
      {(close) => (
        <div className="py-1 text-sm">
          <div className="flex flex-col px-1">
            {quickDates().map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => { onChange(iso(q.date)); close(); }}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-gray-100"
              >
                <q.icon size={17} style={{ color: q.color }} />
                <span className="flex-1 text-left text-gray-700">{q.label}</span>
                <span className="text-xs text-gray-400">{q.hint}</span>
              </button>
            ))}
            {value && (
              <button
                type="button"
                onClick={() => { onChange(null); close(); }}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-gray-100"
              >
                <Ban size={17} className="text-gray-500" />
                <span className="flex-1 text-left text-gray-700">No date</span>
              </button>
            )}
          </div>

          <div className="my-1 border-t border-gray-100" />
          <MonthGrid selected={selectedDate} onPick={(d) => { onChange(iso(d)); close(); }} />

          {/* Time / Repeat — deferred (recurring + specific time come later) */}
          <div className="my-1 border-t border-gray-100" />
          <div className="flex gap-2 px-3 py-2 text-gray-400">
            <span className="flex items-center gap-1.5 text-sm"><Clock size={15} /> Time</span>
            <span className="flex items-center gap-1.5 text-sm"><Repeat size={15} /> Repeat</span>
          </div>
        </div>
      )}
    </Popover>
  );
}
