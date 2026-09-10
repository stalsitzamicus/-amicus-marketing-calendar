#!/usr/bin/env python3
"""
add_calendar_editor.py — make the Calendar tab's events editable (Jake-mode),
synced through the same Firebase node the photo links already use.

Run it from inside the repo folder:  python3 add_calendar_editor.py
It patches every live-week HTML file that has the current task-edit system,
skips anything already patched or on the older template, and verifies each change.
Safe to run more than once.
"""
import re, sys, glob, os

BLOCK_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cal_editor_block.js")

STATE_OLD = "let taskOverrides={},taskAdds={},taskEditMode=false;"
STATE_NEW = STATE_OLD + "\nlet calAdds={},calOverrides={};"

LOAD_OLD  = "taskOverrides=data.taskOverrides||{}; taskAdds=data.taskAdds||{};"
LOAD_NEW  = LOAD_OLD + "\n    calAdds=data.calAdds||{}; calOverrides=data.calOverrides||{};"

SAVE_OLD  = "dbRef.set({checked,manualGoals,manualBonus,taskQty,taskLinks,taskVerify,taskOverrides,taskAdds});"
SAVE_NEW  = "dbRef.set({checked,manualGoals,manualBonus,taskQty,taskLinks,taskVerify,taskOverrides,taskAdds,calAdds,calOverrides});"

# Replace the whole static renderCalendar() up to the Media-tab marker.
CAL_RE = re.compile(r"function renderCalendar\(\)\{.*?\n\}\n(/\* -+ full Media tab -+ \*/)", re.DOTALL)


def patch_one(path, block):
    with open(path, encoding="utf-8") as fh:
        src = fh.read()

    if "calAdds" in src:
        return ("skip-already", path)

    # All four anchors must be present, exactly once, or we don't touch the file.
    for needle, cnt in ((STATE_OLD, 1), (LOAD_OLD, 1), (SAVE_OLD, 1)):
        if src.count(needle) != cnt:
            return (f"skip-anchor-missing ({needle[:28]}...)", path)
    if len(CAL_RE.findall(src)) != 1:
        return ("skip-renderCalendar-not-matched", path)

    out = src.replace(STATE_OLD, STATE_NEW, 1)
    out = out.replace(LOAD_OLD, LOAD_NEW, 1)
    out = out.replace(SAVE_OLD, SAVE_NEW, 1)
    out = CAL_RE.sub(lambda m: block.rstrip("\n") + "\n" + m.group(1), out, count=1)

    # Post-conditions: prove every edit landed.
    checks = {
        "state": "let calAdds={},calOverrides={};" in out,
        "load": "calAdds=data.calAdds||{};" in out,
        "save": "calAdds,calOverrides});" in out,
        "editor": "function effectiveEvents(){" in out and "function addEvent(){" in out,
        "single-renderCalendar": out.count("function renderCalendar()") == 1,
    }
    if not all(checks.values()):
        return (f"FAIL-verify {[k for k,v in checks.items() if not v]}", path)

    with open(path, "w", encoding="utf-8") as fh:
        fh.write(out)
    return ("patched", path)


def main():
    with open(BLOCK_PATH, encoding="utf-8") as fh:
        block = fh.read()
    files = sorted(f for f in glob.glob("*.html")
                   if re.match(r"^[a-z]+-\d{4}-\d{2}-\d{2}.*\.html$", os.path.basename(f)))
    results = [patch_one(f, block) for f in files]
    patched = [p for s, p in results if s == "patched"]
    for status, path in results:
        if status.startswith(("patched", "FAIL")):
            print(f"{status:>10}  {path}")
    print(f"\n{len(patched)} file(s) patched.")
    if any(s.startswith("FAIL") for s, _ in results):
        sys.exit(1)


if __name__ == "__main__":
    main()
