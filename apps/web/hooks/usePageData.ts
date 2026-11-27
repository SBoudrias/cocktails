'use client';

import { useEffect, useRef } from 'react';
import { useSharedJson } from '#/hooks/useSharedJson';

/**
 * Point the document's head at the page once its data renders: the title,
 * the description and the canonical link. Every detail page of a type is a
 * byte-identical copy of one shell, so the exported HTML carries none of
 * them (a shell canonical would point every page at the shell's URL).
 */
function useDocumentHead({
  path,
  title,
  description,
}: {
  path: string;
  title: string | undefined;
  description: string | undefined;
}) {
  useEffect(() => {
    if (title == null) return;
    document.title = title;
  }, [title]);

  // The shell's description is the root layout's: point it at the page,
  // and hand it back on the way out (a soft navigation to a static page
  // renders that page's own).
  useEffect(() => {
    const meta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description == null || meta == null) return;
    const previous = meta.content;
    meta.content = description;
    return () => {
      meta.content = previous;
    };
  }, [description]);

  // The shell has no canonical: the page adds its own while it shows.
  const ready = title != null;
  useEffect(() => {
    if (!ready) return;
    const link = document.createElement('link');
    link.rel = 'canonical';
    // The page's own URL, without its query: the same canonical the static
    // pages get from the root layout (`./` against the deploy's origin).
    // `path` is the router's, under the base path next.config.ts sets (a
    // client module cannot import the config, so the default is mirrored).
    link.href = new URL(
      `${process.env.NEXT_PUBLIC_BASE_PATH || '/cocktails'}${path}`,
      location.origin,
    ).href;
    document.head.append(link);
    return () => link.remove();
  }, [ready, path]);
}

/**
 * Scroll to the top when a link moves the page to another entry of its
 * type. The client router scrolls a page into view when its route segments
 * change, but every page of a type renders the same shell segments, so a
 * link from one ingredient to another would keep the previous scroll
 * position. Back and forward navigations keep theirs, like the router's.
 */
function useScrollToTopOnNavigation(path: string) {
  const previousPath = useRef(path);
  const popped = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      popped.current = true;
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (previousPath.current === path) return;
    previousPath.current = path;
    if (!popped.current) window.scrollTo(0, 0);
    popped.current = false;
  }, [path]);
}

/**
 * A detail page's type data file (fetched once per session and shared by
 * every page of the type), for the page at `path` to render its entry of
 * `file.pages` from.
 *
 * The server render has no data, because the export holds one shell per
 * page type: hydration matches the loading state, then the data renders.
 * `missing` is true once the file loaded without an entry for the path;
 * `failed` when the file could not load.
 */
export function usePageData<
  F extends { pages: Record<string, { title: string; description: string }> },
>(
  path: string,
  resource: { load: () => Promise<F>; getLoaded: () => F | undefined },
): { file: F | undefined; missing: boolean; failed: boolean } {
  const { value: file, failed } = useSharedJson({
    load: resource.load,
    getLoaded: resource.getLoaded,
    // The data is the whole page: it loads right away.
    urgent: true,
  });

  const page = file?.pages[path];
  useDocumentHead({ path, title: page?.title, description: page?.description });
  useScrollToTopOnNavigation(path);

  return {
    file,
    missing: file != null && page == null,
    failed: file == null && failed,
  };
}
