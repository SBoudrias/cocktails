// Run against a local production export or dev server. Uses a throwaway Chrome
// profile and Node's built-in WebSocket; no browser automation dependency.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { match, P } from 'ts-pattern';

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:8123/cocktails';
assert.ok(
  new URL(baseUrl).hostname === '127.0.0.1' || new URL(baseUrl).hostname === 'localhost',
  'Run browser regressions against a local test server',
);
const binary =
  process.env.CHROME_BINARY ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = await mkdtemp(path.join(process.env.TMPDIR ?? tmpdir(), 'desktop-ux-'));
const chrome = spawn(binary, [
  '--headless=new',
  '--remote-debugging-port=0',
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--disable-background-networking',
  'about:blank',
]);
let stderr = '';
chrome.stderr.on('data', (data) => {
  stderr += String(data);
});
const pending = new Map<
  number,
  { resolve: (value: unknown) => void; reject: (error: Error) => void }
>();
let nextId = 0;
let socket: WebSocket | undefined;
let checks = 0;

async function send(
  method: string,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  assert.ok(socket != null);
  const id = ++nextId;
  const promise = new Promise<unknown>((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timed out: ${method}`));
    }, 15_000);
    timeout.unref();
    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    });
  });
  socket.send(JSON.stringify({ id, method, params }));
  return promise;
}

async function evaluate(expression: string): Promise<unknown> {
  const response = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return match(response)
    .with({ exceptionDetails: P.nonNullable }, (result) => {
      throw new Error(JSON.stringify(result.exceptionDetails));
    })
    .with({ result: { value: P.select() } }, (value) => value)
    .otherwise(() => {
      throw new Error(`Missing evaluation result: ${JSON.stringify(response)}`);
    });
}

async function verify(name: string, expression: string) {
  const value = await evaluate(expression);
  assert.equal(value, true, `${name}: ${JSON.stringify(value)}`);
  checks++;
  console.log(`PASS ${name}`);
}

async function navigate(route: string) {
  await send('Page.navigate', { url: `${baseUrl}${route}` });
  for (let i = 0; i < 100; i++) {
    await delay(100);
    if (
      (await evaluate(
        `location.pathname === ${JSON.stringify(new URL(`${baseUrl}${route}`).pathname)} && document.readyState === 'complete' && !!document.querySelector('main')`,
      )) === true
    )
      break;
  }
  await delay(350);
}

async function viewport(width: number) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height: width === 390 ? 844 : 900,
    deviceScaleFactor: 1,
    mobile: width === 390,
  });
}

async function key(key: string, code: string, modifiers = 0) {
  const keyCode = match(code)
    .with('Tab', () => 9)
    .with('Enter', () => 13)
    .with('Slash', () => 191)
    .otherwise(() => 0);
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key,
    code,
    modifiers,
    windowsVirtualKeyCode: keyCode,
    // Enter's character event triggers native implicit form submission.
    text: code === 'Enter' ? '\r' : '',
  });
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key,
    code,
    modifiers,
    windowsVirtualKeyCode: keyCode,
  });
  await delay(80);
}

async function screenshot(name: string) {
  const dir = process.env.SCREENSHOT_DIR;
  if (dir == null) return;
  const result = await send('Page.captureScreenshot', { format: 'png' });
  const data = match(result)
    .with({ data: P.string }, (value) => value.data)
    .otherwise(() => {
      throw new Error('Screenshot failed');
    });
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${name}.png`), Buffer.from(data, 'base64'));
}

try {
  let browserWs: string | undefined;
  for (let i = 0; i < 100 && browserWs == null; i++) {
    await delay(100);
    browserWs = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1];
  }
  assert.ok(browserWs, `Chrome did not start: ${stderr}`);
  const debuggingOrigin = browserWs.replace('ws://', 'http://').split('/devtools/')[0];
  const response: unknown = await (
    await fetch(`${debuggingOrigin}/json/new?about:blank`, { method: 'PUT' })
  ).json();
  const targetWs = match(response)
    .with({ webSocketDebuggerUrl: P.string }, (value) => value.webSocketDebuggerUrl)
    .otherwise(() => {
      throw new Error('No Chrome page target');
    });
  socket = new WebSocket(targetWs);
  socket.addEventListener('message', (event) => {
    const payload: unknown = JSON.parse(String(event.data));
    match(payload)
      .with({ id: P.number, error: P.select() }, (error, result) => {
        pending.get(result.id)?.reject(new Error(JSON.stringify(error)));
        pending.delete(result.id);
      })
      .with({ id: P.number, result: P.select() }, (value, result) => {
        pending.get(result.id)?.resolve(value);
        pending.delete(result.id);
      })
      .otherwise(() => {});
  });
  await new Promise<void>((resolve, reject) => {
    assert.ok(socket != null);
    socket.addEventListener('open', () => resolve(), { once: true });
    socket.addEventListener(
      'error',
      () => reject(new Error('Chrome connection failed')),
      { once: true },
    );
  });
  await send('Page.enable');

  for (const width of [1440, 900, 390]) {
    await viewport(width);
    await navigate('/');
    await verify(
      `home fits viewport at ${width}`,
      `(() => {
      const main = document.querySelector('main').getBoundingClientRect();
      return main.right <= innerWidth && document.documentElement.scrollWidth <= innerWidth;
    })()`,
    );
    await verify(
      `source names and counts never intersect at ${width}`,
      `(() => {
      return [...document.querySelectorAll('main a[href*="/source/"] .MuiListItem-root')].every(row => {
        const range = document.createRange();
        range.selectNodeContents(row.querySelector('.MuiListItemText-primary'));
        const count = row.querySelector('.MuiListItemSecondaryAction-root').getBoundingClientRect();
        return [...range.getClientRects()].every(name => name.right <= count.left || name.top >= count.bottom || name.bottom <= count.top) && count.right <= innerWidth;
      });
    })()`,
    );
    await screenshot(`home-${width}`);

    await navigate('/list/recipes?search=dai');
    await verify(
      `one global filter and one Clear at ${width}`,
      `(() => {
      const visible = [...document.querySelectorAll('input[type="search"]')].filter(input => input.getClientRects().length);
      const clear = [...document.querySelectorAll('button')].filter(button => button.textContent.trim() === 'Clear' && button.getClientRects().length);
      return visible.length === 1 && visible[0].value === 'dai' && clear.length === 1;
    })()`,
    );
    await evaluate('window.scrollTo(0, 2000); true');
    await key('/', 'Slash');
    await verify(
      `slash preserves scroll and focuses the page search at ${width}`,
      `window.scrollY === 2000 && document.activeElement === document.querySelector('header input[type="search"]')`,
    );
    if (width >= 900) {
      await verify(
        `sidebar stays at 64px after document scrolling at ${width}`,
        `document.querySelector('nav').getBoundingClientRect().top === 64`,
      );
    } else {
      await verify(
        'mobile sidebar is hidden',
        `document.querySelector('nav').getClientRects().length === 0`,
      );
    }
    await evaluate(`document.querySelector('header input[type="search"]').blur(); true`);
    await key('/', 'Slash', 2); // CDP Ctrl modifier
    await verify(
      `Ctrl+/ is untouched at ${width}`,
      `document.activeElement !== document.querySelector('header input[type="search"]')`,
    );
    await evaluate(`document.querySelector('header button').click(); true`);
    await delay(400);
    await verify(
      `Clear resets URL and input at ${width}`,
      `!new URL(location.href).searchParams.has('search') && document.querySelector('header input[type="search"]').value === ''`,
    );

    await navigate('/category/gin');
    if (width >= 900) {
      await verify(
        `direct Gin URL opens both ancestors at ${width}`,
        `document.querySelector('nav a[aria-current="page"]').textContent === 'Gin' && ['categories', 'Spirits'].every(id => document.querySelector('[aria-controls="sidebar-group-' + id + '"]').getAttribute('aria-expanded') === 'true')`,
      );
      await verify(
        `header aligns with the reading column at ${width}`,
        `(() => {
        const toolbar = document.querySelector('header .MuiToolbar-root').getBoundingClientRect();
        const main = document.querySelector('main').getBoundingClientRect();
        return Math.abs((toolbar.left + toolbar.right - main.left - main.right) / 2) <= 1;
      })()`,
      );
      await verify(
        `disclosures control mounted panels at ${width}`,
        `[...document.querySelectorAll('nav button[aria-controls]')].every(button => document.getElementById(button.getAttribute('aria-controls')) != null)`,
      );
      await verify(
        `global and page search scopes are distinct at ${width}`,
        `document.querySelector('nav input[type="search"]').labels[0].textContent === 'Search all recipes' && document.querySelector('header input[type="search"]').getAttribute('aria-label') === 'Filter this page' && ![...document.querySelectorAll('nav button')].some(button => button.textContent.trim() === 'Clear')`,
      );
      await key('/', 'Slash');
      await verify(
        `slash targets Gin's filter at ${width}`,
        `document.activeElement === document.querySelector('header input[type="search"]')`,
      );
      await evaluate(`(() => {
        const input = document.querySelector('nav input[type="search"]');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'mai tai');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      })()`);
      await delay(100);
      if (width === 1440) {
        await evaluate(
          `document.querySelector('nav input[type="search"]').focus(); true`,
        );
        await key('Enter', 'Enter');
      } else {
        await evaluate(
          `document.querySelector('nav button[aria-label="Submit global search"]').click(); true`,
        );
      }
      await delay(700);
      await verify(
        `global submit navigates and seeds the sole filter at ${width}`,
        `location.pathname.endsWith('/list/recipes') && new URL(location.href).searchParams.get('search') === 'mai tai' && document.querySelector('header input[type="search"]').value === 'mai tai' && !document.querySelector('nav input[type="search"]')`,
      );
      await evaluate('history.back(); true');
      await delay(700);
      await verify(
        `Back restores category context at ${width}`,
        `location.pathname.endsWith('/category/gin') && document.querySelector('nav a[aria-current="page"]').textContent === 'Gin'`,
      );
      await evaluate(`document.querySelector('nav').scrollTop = 900; true`);
      await verify(
        `sidebar headings cannot overlap at ${width}`,
        `[...document.querySelectorAll('nav .MuiListSubheader-root')].every(header => getComputedStyle(header).position === 'static')`,
      );
      await screenshot(`gin-scrolled-nav-${width}`);
      await navigate('/source/book/minimalist-tiki');
      await verify(
        `direct source URL expands ancestors at ${width}`,
        `document.querySelector('nav a[aria-current="page"]').textContent === 'Minimalist Tiki' && ['sources', 'book'].every(id => document.querySelector('[aria-controls="sidebar-group-' + id + '"]').getAttribute('aria-expanded') === 'true')`,
      );
      await navigate('/');
      await key('Tab', 'Tab');
      await verify(
        `skip link is visible on keyboard focus at ${width}`,
        `document.activeElement.textContent === 'Skip to content' && document.activeElement.getBoundingClientRect().top >= 0`,
      );
      await key('Enter', 'Enter');
      await verify(
        `skip link focuses main at ${width}`,
        `document.activeElement.id === 'main-content'`,
      );
      await navigate('/');
      for (let tabs = 0; tabs < 20; tabs++) {
        if (
          (await evaluate(
            `document.activeElement.textContent === 'All Recipes' && !!document.activeElement.closest('nav')`,
          )) === true
        )
          break;
        await key('Tab', 'Tab');
      }
      await verify(
        `MUI navigation has a 2px cyan keyboard ring at ${width}`,
        `(() => { const style = getComputedStyle(document.activeElement); return document.activeElement.closest('nav') != null && style.outlineWidth === '2px' && style.outlineStyle === 'solid' && style.outlineColor === 'rgb(141, 212, 237)'; })()`,
      );
      await verify(
        `collapsed home navigation fits its pane at ${width}`,
        `document.querySelector('nav').scrollHeight <= document.querySelector('nav').clientHeight`,
      );
      await evaluate(
        `document.querySelector('[aria-controls="sidebar-group-categories"]').click(); true`,
      );
      await delay(400);
      await evaluate(
        `document.querySelector('[aria-controls="sidebar-group-Spirits"]').click(); true`,
      );
      await delay(400);
      await evaluate(
        `document.querySelector('nav').scrollTop = 900; window.scrollTo(0, 400); true`,
      );
      const documentY = await evaluate('window.scrollY');
      await key('/', 'Slash');
      await verify(
        `slash reveals the global launcher without document movement at ${width}`,
        `document.activeElement === document.querySelector('nav input[type="search"]') && document.querySelector('nav').scrollTop === 0 && window.scrollY === ${JSON.stringify(documentY)}`,
      );
    }
    await navigate('/calculators/saline');
    if (width === 390) {
      await verify(
        'mobile saline footer matches pinned main geometry (390×844)',
        `(() => {
        const footer = document.querySelector('a[href*="github.com/SBoudrias"]').closest('.MuiStack-root');
        return footer.getBoundingClientRect().top === 494 && document.documentElement.scrollHeight === 844;
      })()`,
      );
    }
    await screenshot(`saline-${width}`);
  }
  console.log(`${checks} browser regressions passed`);
} finally {
  socket?.close();
  chrome.kill();
  await delay(150);
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
