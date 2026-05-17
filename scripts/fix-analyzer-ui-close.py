from pathlib import Path

p = Path(__file__).resolve().parents[1] / "src/components/dashboard/AnalyzerUI.tsx"
text = p.read_text(encoding="utf-8")
needle = "tone={cloudSync ? 'success' : 'warn'}\n              />\n            "
wrong_close = "</" + "motion.div>"
right_close = "</" + "motion.div>"  # NO - div only
right_close = "</" + "div>"
wrong = needle + wrong_close + "\n            <motion.div"
right = needle + right_close + "\n            <motion.div"
if wrong not in text:
    raise SystemExit("pattern not found")
p.write_text(text.replace(wrong, right, 1), encoding="utf-8")
print("fixed")
