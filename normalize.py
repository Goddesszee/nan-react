import re, glob

FILES = [
    "public/legacy/app.html", "public/legacy/app.js",
    "public/legacy/style.css", "public/legacy/ui.js",
] + glob.glob("src/**/*.jsx", recursive=True) + glob.glob("src/**/*.css", recursive=True) + ["index.html"]

# ---------- 1. FONT NORMALIZATION ----------
# Each pattern is (regex, quote_char) so the replacement always matches the quote
# style that was actually used — critical inside JS string literals like
# cssText = 'font-family:"JetBrains Mono",monospace' where the outer string is
# single-quoted and the font name MUST stay double-quoted.
FONT_STACKS = [
    (r"'Space Grotesk',\s*'Inter var',\s*'Inter',\s*sans-serif", "'"),
    (r"'Space Grotesk',\s*sans-serif", "'"),
    (r'"Space Grotesk",\s*sans-serif', '"'),
    (r"'JetBrains Mono',\s*'Courier New',\s*monospace", "'"),
    (r"'JetBrains Mono',\s*'SF Mono',\s*'Fira Code',", "'"),
    (r"'JetBrains Mono',\s*'Inter',\s*monospace", "'"),
    (r"'JetBrains Mono',\s*monospace", "'"),
    (r'"JetBrains Mono",\s*monospace', '"'),
    (r"'DM Mono',\s*'Roboto Mono',\s*monospace", "'"),
    (r"'DM Sans',\s*sans-serif", "'"),
    (r'"DM Sans",\s*sans-serif', '"'),
    (r"'Fraunces',\s*serif", "'"),
    (r'"Fraunces",\s*serif', '"'),
    (r"'Syne',\s*'Inter',\s*sans-serif", "'"),
    (r"'Syne',\s*sans-serif", "'"),
    (r"'Space Mono',\s*monospace", "'"),
    (r"ui-monospace,\s*monospace", "'"),
    (r"Georgia,\s*serif", "'"),
]
for f in FILES:
    try:
        content = open(f, encoding="utf-8").read()
    except FileNotFoundError:
        continue
    orig = content
    for pat, q in FONT_STACKS:
        repl = f"{q}Inter{q},sans-serif" if q == "'" else "Inter,sans-serif" if "Georgia" in pat or "ui-monospace" in pat else f'{q}Inter{q},sans-serif'
        content = re.sub(pat, repl, content)
    content = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/css2\?family=Space\+Grotesk[^"]*">\n?', "", content)
    content = re.sub(r"@import url\('https://fonts\.googleapis\.com/css2\?family=Syne[^']*'\);\n?", "", content)
    if content != orig:
        open(f, "w", encoding="utf-8").write(content)

# ---------- 2. EMOJI REMOVAL (decorative only; arrows/check/cross kept as functional icons) ----------
EMOJI_CHARS = (
    "🎉📋📊📍📅💰🔗🧾🔍🔄⏰📤🎯🎤💱💧💡💸🔵👋♡👁🌐📈🔔📨💬✨🔷🔴🌉💳📱💚💼✉📌🏦🗑🦊⭕🏷🟣📆⚙📺⚪🖼"
    "☀🌙⏏⬛➕👤📁🕓🕒⭐📞🧭👥👛🐰🙈⏹🔐🫂👑🚀📶🔑🤖🏫🟢⬇🚫🇳🇬🏪⏳"
    "🛍⚡🔺🤝🏠"
    "\ufe0f"
)
# NOTE: ✓ ✕ ✗ ❌ ✅ ⚠ ★ ☆ ✦ are deliberately excluded — the toast() system in
# public/legacy/app.js keys off '✓ '/'❌ ' message prefixes (msg.startsWith(...))
# to pick title/style, so they're logic-bearing, not decorative. Left in place
# everywhere for consistency rather than risk missing a dependency in one file.
emoji_pattern = re.compile("[" + re.escape(EMOJI_CHARS) + "]")

for f in FILES:
    try:
        content = open(f, encoding="utf-8").read()
    except FileNotFoundError:
        continue
    orig = content
    content = emoji_pattern.sub("", content)
    # Only collapse repeated spaces/tabs on the SAME line — never touch newlines,
    # and never touch anything adjacent to quotes/tags (that's not safe to guess at).
    content = re.sub(r"[ \t]{2,}", " ", content)
    if content != orig:
        open(f, "w", encoding="utf-8").write(content)

# ---------- 3. DASH REMOVAL (em/en dash punctuation only, never plain hyphens) ----------
# A dash that is the ENTIRE content of a quoted string (e.g. '—', "—", `—`) is a
# placeholder/sentinel value used throughout this app for "no data yet" — not
# prose punctuation. Protect those from removal; only rewrite dashes embedded in
# actual sentences/labels.
PLACEHOLDER = re.compile(r"(['\"`])([\u2013\u2014])\1")

for f in FILES:
    try:
        content = open(f, encoding="utf-8").read()
    except FileNotFoundError:
        continue
    orig = content

    # Stash placeholder sentinels behind a token that contains no dash/quote chars.
    stash = []
    def protect(m):
        stash.append(m.group(0))
        return f"@@DASH_SENTINEL_{len(stash)-1}@@"
    content = PLACEHOLDER.sub(protect, content)

    def endash_sub(m):
        before, after = m.group(1), m.group(2)
        if before.isdigit() and after.isdigit():
            return f"{before} to {after}"
        return f"{before}, {after}"

    content = re.sub(r"(\w)\s*\u2013\s*(\w)", endash_sub, content)
    content = re.sub(r"&ndash;|&#8211;|&#x2013;", " to ", content)
    content = re.sub(r"[ \t]*\u2014[ \t]*", ", ", content)
    content = re.sub(r"[ \t]*(&mdash;|&#8212;|&#x2014;)[ \t]*", ", ", content)

    # Restore the protected sentinels untouched.
    for i, original in enumerate(stash):
        content = content.replace(f"@@DASH_SENTINEL_{i}@@", original)

    if content != orig:
        open(f, "w", encoding="utf-8").write(content)

print("done")
