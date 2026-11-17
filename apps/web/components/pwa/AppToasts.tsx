'use client';

import { OverlayHost } from '@ui-sdk/react/overlays';
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastTitle,
} from '@ui-sdk/react/toast';
import './toast.css';

// The app's one toast host: mounts near the root, renders everything the
// imperative toasts (components/pwa/pwa-toasts) fire, painted as moonlit
// glass by toast.css. A custom renderer so every toast gets the app's
// action styling (solid jade) whatever its origin; the cancel button only
// renders for toasts that carry one (the install hint's "Not now").
export default function AppToasts() {
  return (
    <OverlayHost
      toast={{
        children: (toast) => (
          <Toast>
            <ToastTitle />
            <ToastDescription />
            {toast.cancel && (
              <ToastClose action={toast.cancel.onCancel}>{toast.cancel.label}</ToastClose>
            )}
            <ToastAction data-variant="solid" />
          </Toast>
        ),
      }}
    />
  );
}
