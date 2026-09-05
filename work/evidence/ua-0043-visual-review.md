# UA-0043 first browser review (candidate still in progress)

Evidence: `npm run test:e2e` using installed Chromium headless revision 1234 after download of revision 1243 timed out. Tests are against the compiled production SSR app with isolated PGlite SQL and real Better Auth sessions, not mocked API routes. The public home and Vietnamese mobile docs passed axe WCAG2A/AA + 2.1AA and no horizontal overflow at 390px; this does not prove admin accessibility yet.

- Publishing test reached authenticated editor, filled both languages and exercised actual Markdown split preview. Test's exact getByLabel selector for category failed even though the accessible combobox was present; changed test to getByRole(combobox, name=Category). This was a test-locator issue, not an absent category.
- P1 visual usability: screenshot `test-results/browser/publishing-real-publishing-e146a--publish-comment-moderation/test-failed-1.png` shows editor settings sidebar controls still browser-default, labels and values crowded together, slug overflowing its URL. Main title uses oversized display typography unsuitable for editor. Add a well-spaced styled settings form, responsive readable editor heading, full-width 44px+ controls. Verify screenshot and admin axe after changes.
- P2: typography looks like browser fallback despite installed font packages; inspect the font imports in main/styles against design-system MASTER. Desktop also shows mobile hamburger simultaneously with full nav. Verify both intentionally or fix breakpoint visibility.
- P2 portability: SEO preview must display the configured/current installation origin, not a hardcoded personal domain in all clones.
- Whole UI remains pending final report/review. Do not mark done based only on 47 green unit/component/SQL tests.
