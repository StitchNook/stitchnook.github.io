import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, CircleHelp } from "lucide-react";
import { PanelHeaderContext } from "./panelContext";
import { t } from "./ToolPanel.i18n";

const STORAGE_KEY = "stitchly.panel.tool";
const NARROW = "(max-width: 1199px)";

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "closed";
  } catch {
    return false;
  }
}

function useNarrow() {
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW).matches);
  useEffect(() => {
    const query = window.matchMedia(NARROW);
    const update = () => setNarrow(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return narrow;
}

/**
 * Settings of the active tool, next to the tool rail. Only rich tools (text,
 * selection / pending preview) use it. Folds to a thin strip (remembered); on
 * narrow windows it floats over the grid and a click beside it folds it.
 */
export function ToolPanel(props: {
  /** Identifies the content: a new content reopens a panel dismissed in overlay mode. */
  contentKey: string | null;
  title: string;
  icon: ReactNode;
  onHelp: () => void;
  children: ReactNode;
}) {
  const [collapsed, setCollapsedState] = useState(readCollapsed);
  const narrow = useNarrow();
  const [dismissed, setDismissed] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);

  const setCollapsed = (next: boolean) => {
    setCollapsedState(next);
    setDismissed(null);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "closed" : "open");
    } catch {
      /* Storage unavailable: the state lasts for this session. */
    }
  };

  const visible = props.contentKey !== null;
  // Kept mounted while hidden (see the children wrapper below).
  const folded = collapsed || (narrow && dismissed === props.contentKey);

  // Overlay mode: a click elsewhere folds the panel until the content changes.
  useEffect(() => {
    if (!narrow || folded || !visible) return;
    const onDown = (event: PointerEvent) => {
      if (ref.current?.contains(event.target as Node)) return;
      // Popovers and modals live outside the panel but belong to it.
      if (
        (event.target as Element).closest?.('[role="dialog"], [data-popover]')
      )
        return;
      setDismissed(props.contentKey);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [narrow, folded, visible, props.contentKey]);

  return (
    <aside
      ref={ref}
      hidden={!visible}
      aria-label={t.settings(props.title)}
      className={`no-print shrink-0 overflow-y-auto border-r border-panel-line bg-panel ${
        folded
          ? "w-8"
          : narrow
            ? "absolute inset-y-0 left-14 z-30 w-76 shadow-2xl shadow-black/40"
            : "w-76"
      }`}
    >
      {folded ? (
        <button
          type="button"
          onClick={() => (collapsed ? setCollapsed(false) : setDismissed(null))}
          title={t.show(props.title)}
          className="flex h-full w-full flex-col items-center gap-2 py-3 text-slate-400 hover:bg-panel-soft hover:text-slate-200"
        >
          <ChevronRight size={14} />
          <span className="text-slate-400">{props.icon}</span>
          <span className="text-[11px] font-semibold tracking-[0.12em] uppercase [writing-mode:vertical-rl]">
            {props.title}
          </span>
        </button>
      ) : (
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-panel-line bg-panel px-3 py-2">
          <span className="text-slate-400">{props.icon}</span>
          <h2 className="flex-1 text-[11px] font-semibold tracking-[0.12em] text-slate-300 uppercase">
            {props.title}
          </h2>
          <button
            type="button"
            onClick={props.onHelp}
            title={t.help}
            className="rounded p-1 text-slate-400 hover:bg-panel-soft hover:text-slate-200"
          >
            <CircleHelp size={14} />
          </button>
          <button
            type="button"
            onClick={() =>
              narrow ? setDismissed(props.contentKey) : setCollapsed(true)
            }
            title={t.fold}
            className="rounded p-1 text-slate-400 hover:bg-panel-soft hover:text-slate-200"
          >
            <ChevronLeft size={14} />
          </button>
        </header>
      )}
      {/* Same place in the tree whether folded or not: the text panel keeps what was typed. */}
      <div hidden={folded}>
        <PanelHeaderContext.Provider value={false}>
          {props.children}
        </PanelHeaderContext.Provider>
      </div>
    </aside>
  );
}
