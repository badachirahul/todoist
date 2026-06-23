import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CalendarDays, Sun, ArrowRight, Armchair, Ban, Clock, Repeat, ChevronLeft, ChevronRight, Circle } from "lucide-react";
import Popover from "../components/Popover";

const RED = "#dc4c3e";
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const sameDay = (a, b) => a && b && iso(a) === iso(b);
const shortWeekday = (d) => d.toLocaleDateString("en-GB", { weekday: "short" });
const shortDate = (d) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const longDate = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const monthLabel = (d) => d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

function quickDates() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dow = today.getDay(); // 0=Sun..6=Sat
  const nextMon = addDays(today, ((1 - dow + 7) % 7) || 7);
  const nextSat = addDays(today, ((6 - dow + 7) % 7) || 7);
  return [
    { label: "Today", hint: shortWeekday(today), date: today, icon: CalendarDays, color: "#058527" },
    { label: "Tomorrow", hint: shortWeekday(addDays(today, 1)), date: addDays(today, 1), icon: Sun, color: "#ad6200" },
    { label: "Next week", hint: shortDate(nextMon), date: nextMon, icon: ArrowRight, color: "#692fc2" },
    { label: "Next weekend", hint: shortDate(nextSat), date: nextSat, icon: Armchair, color: "#246fe0" },
  ];
}

function MonthGrid({ first, selected, today, onPick, dimLabel }) {
  const year = first.getFullYear();
  const month = first.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1))];

  return (
    <div className="px-3 pb-1">
      {/* Label kept in flow (invisible when shown in the sticky header) to avoid scroll jumps. */}
      <div className={`py-1 text-[13px] font-semibold text-gray-800 ${dimLabel ? "invisible" : ""}`}>{monthLabel(first)}</div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
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

const EST_MONTH_H = 248; // estimated month height before it's measured (corrected on mount)
const WINDOW_BUFFER = 3; // months kept mounted above/below the viewport

/**
 * Infinitely-scrolling month calendar — windowed so the DOM stays bounded no
 * matter how far you scroll. Only the months near the viewport are mounted;
 * off-screen months are unmounted and replaced by two spacer divs sized from
 * measured month heights, which keeps scroll position (and the ‹ ○ › nav,
 * sticky label, infinite scroll) behaving exactly as before.
 */
function Calendar({ selected, today, onPick }) {
  const start = useRef(new Date(today.getFullYear(), today.getMonth(), 1)).current;
  const monthDate = (i) => new Date(start.getFullYear(), start.getMonth() + i, 1);

  const [total, setTotal] = useState(24); // how many months virtually exist (grows)
  const [win, setWin] = useState({ start: 0, end: 12 }); // mounted index range [start, end)
  const [topIdx, setTopIdx] = useState(0);
  const [, bump] = useState(0); // forces a recompute after heights are measured

  const scrollRef = useRef(null);
  const heights = useRef(new Map()); // index -> measured height
  const monthEls = useRef(new Map()); // index -> DOM node (mounted months only)

  const h = (i) => heights.current.get(i) ?? EST_MONTH_H;
  const offsetOf = (i) => { let acc = 0; for (let k = 0; k < i; k++) acc += h(k); return acc; };

  // Measure mounted months; correct the height map and recompute if it changed.
  useLayoutEffect(() => {
    let changed = false;
    for (let i = win.start; i < win.end; i++) {
      const el = monthEls.current.get(i);
      if (!el) continue;
      const measured = el.offsetHeight;
      if (measured > 0 && Math.abs((heights.current.get(i) ?? 0) - measured) > 1) {
        heights.current.set(i, measured);
        changed = true;
      }
    }
    if (changed) bump((n) => n + 1);
  });

  function recompute() {
    const c = scrollRef.current;
    if (!c) return;
    const top = c.scrollTop;
    const bottom = top + c.clientHeight;

    let acc = 0, first = 0, last = total - 1;
    for (let i = 0; i < total; i++) {
      const hi = h(i);
      if (acc + hi > top && acc <= top) first = i;
      if (acc >= bottom) { last = i - 1; break; }
      acc += hi;
      last = i;
    }
    if (last < first) last = first;

    if (last >= total - WINDOW_BUFFER - 1) setTotal((t) => t + 12); // grow infinitely
    setWin({
      start: Math.max(0, first - WINDOW_BUFFER),
      end: Math.min(total, last + 1 + WINDOW_BUFFER),
    });
    setTopIdx(first);
  }

  function scrollToMonth(i) {
    const target = Math.max(0, Math.min(i, total - 1));
    if (scrollRef.current) scrollRef.current.scrollTo({ top: offsetOf(target), behavior: "smooth" });
  }

  // Initial window once mounted.
  useEffect(() => { recompute(); /* eslint-disable-next-line */ }, []);

  const topSpacer = offsetOf(win.start);
  const bottomSpacer = Math.max(0, offsetOf(total) - offsetOf(win.end));
  const mounted = [];
  for (let i = win.start; i < win.end; i++) mounted.push(i);

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-gray-100">
      <div className="flex items-center justify-between px-3 pt-2">
        <span className="text-[13px] font-semibold text-gray-800">{monthLabel(monthDate(topIdx))}</span>
        <div className="flex items-center gap-1 text-gray-500">
          <button type="button" onClick={() => scrollToMonth(topIdx - 1)} className="rounded p-0.5 hover:bg-gray-100"><ChevronLeft size={16} /></button>
          <button type="button" onClick={() => scrollToMonth(0)} className="rounded p-0.5 hover:bg-gray-100"><Circle size={11} /></button>
          <button type="button" onClick={() => scrollToMonth(topIdx + 1)} className="rounded p-0.5 hover:bg-gray-100"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 px-3 pt-1 text-center text-xs text-gray-400">
        {WEEKDAYS.map((w, i) => <div key={i}>{w}</div>)}
      </div>
      <div ref={scrollRef} onScroll={recompute} className="no-scrollbar min-h-0 flex-1 overflow-y-auto pt-1">
        <div style={{ height: topSpacer }} />
        {mounted.map((i) => (
          <div key={i} ref={(el) => { if (el) monthEls.current.set(i, el); else monthEls.current.delete(i); }}>
            <MonthGrid first={monthDate(i)} selected={selected} today={today} onPick={onPick} dimLabel={i === topIdx} />
          </div>
        ))}
        <div style={{ height: bottomSpacer }} />
      </div>
    </div>
  );
}

export default function DatePicker({ value, onChange, trigger: customTrigger, align = "left", fullWidth = false }) {
  const selectedDate = value ? new Date(value + "T00:00:00") : null;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const trigger = customTrigger ?? (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
    >
      <CalendarDays size={16} className="text-gray-500" />
      {selectedDate ? longDate(selectedDate) : "Date"}
    </button>
  );

  return (
    <Popover trigger={trigger} align={align} fullWidth={fullWidth} className="w-[250px]">
      {(close) => (
        <div className="flex h-[522px] max-h-[78vh] flex-col text-sm">
          {/* Type a date — visual placeholder (NLP parsing deferred) */}
          <div className="flex-none border-b border-gray-100 p-2">
            <input placeholder="Type a date" className="w-full px-1 text-sm outline-none placeholder:text-gray-400" />
          </div>

          {/* Quick options */}
          <div className="flex flex-none flex-col px-1 pt-1">
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

          <Calendar selected={selectedDate} today={today} onPick={(d) => { onChange(iso(d)); close(); }} />

          {/* Time / Repeat — visual placeholders (Phase 8) */}
          <div className="flex flex-none gap-2 border-t border-gray-100 p-2">
            <button type="button" disabled className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-gray-200 py-1.5 text-gray-500">
              <Clock size={15} /> Time
            </button>
            <button type="button" disabled className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-gray-200 py-1.5 text-gray-500">
              <Repeat size={15} /> Repeat
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}
