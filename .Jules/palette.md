## 2024-05-22 - Micro-interactions in Complex Lists
**Learning:** In dense lists like model selectors, icon-only buttons (hearts, close icons) often get overlooked for accessibility. Adding dynamic ARIA labels (`aria-label`) that reference the specific item name (e.g., "Remove GPT-4") is critical for screen reader users to know *which* item they are acting on.
**Action:** Always check dynamic lists with icon-only actions for specific, descriptive ARIA labels.
