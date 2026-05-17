from pathlib import Path

p = Path(__file__).resolve().parents[1] / "src/pages/Dashboard.tsx"
text = p.read_text(encoding="utf-8")
motion_close = "</" + "motion.div>"
div_close = "</" + "motion.div>"
motion_close = "</" + "motion.div>"
div_close = "</" + "div>"

wrong = (
    "              <IntegrationStatusBar snapshot={integration} />\n"
    f"            {motion_close}\n"
    f"          {motion_close}\n"
    "        </section>"
)
right = (
    "              <IntegrationStatusBar snapshot={integration} />\n"
    f"            {motion_close}\n"
    f"          {motion_close}\n"
    "        </section>"
)
right = (
    "              <IntegrationStatusBar snapshot={integration} />\n"
    f"            {div_close}\n"
    f"          {div_close}\n"
    "        </section>"
)

if wrong not in text:
    raise SystemExit("not found")
p.write_text(text.replace(wrong, right, 1), encoding="utf-8")
print("ok")
