# Agent Operating Instructions

## 1. Before writing any code

- Read before you write. Never edit a file you have not read in full in this session. Never call an API, prop, env var, or helper you have not seen defined — in the repo, or in the library's own documentation.
- Learn a library from its documentation or an MCP server, never from its build output. Do not reverse-engineer an API surface out of `node_modules/**/dist` or a bundled `.d.ts`. Reading a package's own data file to confirm a concrete fact is fine; inferring how to call something from its compiled artefacts is not.
- Match the repo, not your habits. Before adding a dependency, check `package.json` for something that already does the job. Before inventing a pattern, find two existing files that solve a similar problem and follow them.
- Do not guess names. If you need a function, config key, route, or table column, grep for it. If it does not exist, say so instead of inventing a plausible one.
- Stop and ask when the task is underspecified in a way that changes the output: unclear data source, unclear target behavior on edge cases, unclear which of two existing modules owns this logic, unclear design intent. One batch of questions, then proceed.
- Do not ask when the answer is discoverable in the repo. Read it.

## 2. Scope

- Change only what the task requires. No drive-by refactors, no reformatting untouched lines, no renaming, no dependency upgrades, no "while I was here" fixes.
- One exception to the smallest diff. When the task would produce several files differing only by a query, a filter or a prop, extract the shared skeleton and move the existing files onto it in the same change — do not copy per file. Two real callers prove the seam; extracting against one locks in the wrong seam. Differences go in as props; item rendering stays in a scoped slot, so the shared component never learns what a card looks like. `AppEntryFeed` is the reference.
- If you spot an unrelated bug, report it in your summary. Do not fix it unsolicited.
- Do not delete code you do not understand. Do not delete tests to make a suite pass.
- Never touch: lockfiles (except via the package manager), CI config, `.env*`, migrations already applied, or anything in `vendor/`, `dist/`, `build/`.

## 3. Correctness

- Your job is to write code only, you are a coding agent, not a test agent. After any change, do NOT run the type checker, linter, or any of the relevant tests. Do not author test files, check scripts or assertion harnesses either — not a `__main__` self-check, not a one-off `node:assert` script — unless the task asks for them in words. Verify by building and running the app.
- Fix root causes. No `any`, no `@ts-ignore`, no broad `try/catch` that swallows, no `eslint-disable`, no widened types to silence an error. If the type system is complaining, the model is wrong.
- Handle the states that actually occur: loading, empty, error, partial, unauthorized, offline, slow. Missing empty and error states is a defect, not a follow-up.
- No placeholders in delivered code: no `TODO`, no `// implement later`, no mock data left in a real path, no hardcoded credentials or URLs.
- Preserve behavior on refactor. If the diff changes observable behavior, it is not a refactor — say so.

## 4. Reporting

- Report what you did, what you ran, what failed, and what you did not verify. In that order.
- If you deviated from the instruction, lead with that.
- No summaries of code the user can read in the diff. No restating the request back.
- Uncertainty is stated as uncertainty. "I could not find X" beats a confident wrong answer.

## 5. Frontend — anti-generic rules

### 5.1 The defaults you must not ship

These are the current machine-generated house style. Treat each as FORBIDDEN unless the brief or existing design system explicitly calls for it:

- Cream/off-white background (`#F4F1EA` family) + high-contrast serif display + terracotta accent (`#D97757` family).
- Near-black background + one acid-green or vermilion accent.
- Broadsheet pastiche: hairline rules, zero radius, dense columns, on a product that is not editorial.
- Unmodified shadcn/Tailwind defaults: `slate`/`zinc` ramp, `rounded-lg`, `shadow-md`, `Inter` at 400/600, `gap-4` everywhere.
- Purple→blue gradient on the primary CTA or hero text.
- Centered hero: big claim, one-line subhead, two buttons ("Get Started" / "Learn More"), three feature cards with Lucide icons below.
- `01 / 02 / 03` numbered markers on content that is not a sequence.
- Emoji as UI iconography.
- Glassmorphism, floating gradient blobs, animated aurora backgrounds, marquee logo strips — unless the brief asks.

If you produce any of the above, you have not designed anything. Restart the direction.

### 5.2 Design decisions must be derived, not selected

Before writing markup, write a short plan and check it against the brief:

- **Subject.** Name the product, its audience, and the single job of this screen in one sentence. Every subsequent choice cites this.
- **Palette.** 4–6 named hex values with a stated reason tied to the subject. Not "modern and clean."
- **Type.** At least two roles — display and body, plus a utility/mono face if there is data. Set an explicit scale, weights, tracking, and measure. Type carries the personality; it is not a delivery vehicle.
- **Layout.** One sentence plus an ASCII wireframe. State what is asymmetric, dense, or unusual and why.
- **Signature.** The one element this screen is remembered by. Exactly one. Everything else stays quiet.

Then apply the calibration test: if this plan could be pasted onto a different product in a different industry without edits, it is generic. Revise the parts that fail and state what changed.

Spend boldness once. Chanel's rule: remove one accessory before leaving.

### 5.3 Tokens, not literals

- Every color, spacing, radius, shadow, duration, and font size comes from the token set defined in the plan or the existing theme. No arbitrary hex in a component, no `mt-[13px]`.
- If a value is needed that does not exist in the tokens, add it to the tokens with a name.
- Define a real spacing scale and stick to it. Vertical rhythm is a decision, not the accumulation of whatever `gap` was nearest.

### 5.4 Content

- Write real copy. `Lorem ipsum`, "Your Company", and "Feature One" are defects. Generic copy makes a design feel templated as fast as generic layout does.
- Name things by what the user controls, not by how the system is built.
- Active voice, sentence case, one job per element. The button says "Publish"; the toast says "Published."
- Errors state what happened and what to do next. They do not apologize and are never vague. Empty states are an invitation to act, not a shrug.

### 5.5 Quality floor — non-negotiable, and not announced

- Responsive to 320px. Test at 320, 768, 1280. No horizontal scroll, no clipped text, no overlapping absolute elements.
- Use existing components as a priority first. Then, and only if needed and not found, semantic HTML. `button` for actions, `a` for navigation, real headings in order, `label` bound to every input, `form` with a submit handler.
- Visible keyboard focus on every interactive element. Never `outline: none` without a replacement. Tab order follows visual order.
- Contrast meets WCAG AA, including placeholder, disabled, and text on images.
- `prefers-reduced-motion` respected.
- Images have dimensions and `alt`. Reserve space so nothing shifts on load.

### 5.6 Motion

- Motion serves the subject or does not exist. One orchestrated moment beats five scattered effects; scattered effects read as machine-generated.
- Nothing animates on a loop in the periphery. Nothing blocks interaction. 150–300ms for UI feedback.

### 5.7 CSS hygiene

- Watch selector specificity collisions, especially section-level vs element-level classes controlling the same margin or padding. Two rules that cancel each other is a bug you introduced.
- One source of truth for spacing between sections. Do not set it on both the parent and the child.
- No `!important`. No `z-index` above a documented scale. No magic numbers without a comment naming what they align to.

### 5.8 Self-critique before delivery

Answer these in your summary. If any answer is weak, fix it before you hand off:

1. What is the signature element, and would someone describe this screen by it?
2. Which choice here would not appear in a generic build of the same brief?
3. Which state (empty / error / loading / long content / long string) did I actually test?
4. What did I not verify?

## 6. Finishing a task — update the docs

Documentation is part of the task, not a follow-up. A change that ships with a stale document has not shipped. Do this before reporting, in the same change as the code.

Each document owns something different. Update the ones the change touched, and only those:

- **`docs/roadmap.md`** — the progress tracker, and the one most often left stale.
  - Move the status of every row the change advanced. `DONE` only when the acceptance criterion is met and merged.
  - A `DONE` row is a title and nothing else — clear its Notes when it closes (§0). Detail lives in git history and the progress log.
  - Anything that would cost a future session to rediscover goes to **§3 Traps**, not into a Notes cell. A trap that is no longer true is worse than no trap: correct it in place.
  - §3 "Current state" describes only what is *not* built. If the change built some of it, cut that line.
  - Append one **§9 progress log** row per working session, newest at the top: what moved, what blocked, what was learned. Rows are the record; write them as though the reader has no memory of the session, because they do not.
  - Note a structural problem you find — an orphaned task in no milestone, a milestone marked closed over a blocked row — in the log. Do not silently fix the plan.
- **`CLAUDE.md`** — architecture, conventions, and the mechanisms an agent must know before editing (content model, data flow, nav, tokens, seed, URL convention). Update when a change alters one of those, adds tooling, or invalidates a statement it makes.
- **`AGENTS.md`** — this file. Only when the working rules themselves change.
- **`docs/getting-started.md`** — the fork-facing guide. Update when a change alters what someone forking the template has to do: an env var, a seed step, a customisation point, a deployment step.
- **`README.md`** — quickstart, env var tables, customisation summary.

Two failure modes to avoid. Do not paste the same paragraph into four files — pick the one that owns the fact and let the others point at it. Do not describe intent; describe what is true now, so the next reader can trust it without checking the code.

If a change genuinely touches no document, say so in the report. That is a claim, not a default.

## Output

Make your output as short and brief as possible. Make your thinking as well short and brief and to the point. No beating around the bushes.
