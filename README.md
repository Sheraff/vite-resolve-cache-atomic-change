# Vite / Rolldown: a missing file stays missing after it comes back as a `change`

Issue: https://github.com/rolldown/rolldown/issues/11648

`src/c.js` imports `./a`. `src/a.js` is removed, `/src/c.js` is requested while it is gone, and `a.js` is written back
at once. Chokidar's `atomic` option reports the remove + re-create as one `change`, and `/src/c.js` keeps failing with
`Failed to resolve import "./a"` until some file is created or deleted, or the server restarts.

```sh
npm install
npm run repro     # exits 1
npm run control   # a.js comes back after 300 ms (`unlink` + `add`): OK
```

vite 8.3.8 (rolldown 1.2.19):

```
a.js gone,   /src/c.js: Failed to resolve import "./a"
a.js back,   /src/c.js: Failed to resolve import "./a"
watcher events: change src/a.js
after creating an unrelated file, /src/c.js: ok
FAIL: c.js still cannot resolve ./a after a.js is back
```

The script was written by an AI coding agent (Claude).
