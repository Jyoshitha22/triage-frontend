/**
 * Browser push notifications — used only for "your doctor has replied,"
 * while the patient's tab is open (or backgrounded) on this device.
 * This is NOT the same as a real push service (which can wake a fully
 * closed browser/app) — it needs the tab to still be open somewhere.
 * That's a real limitation, not a bug: a true "notify me even after I
 * close everything" needs a push subscription + backend to trigger it,
 * which is more infrastructure than this project has right now. Email
 * is the other option already wired in for the login identity — a
 * natural next step if you want closed-tab notification later.
 */

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function notifyReplyReady(bodyText) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification('Your doctor has replied', {
      body: bodyText || 'Tap to see what they said.',
      icon: undefined,
      tag: 'triage-reply-ready',
    });
  } catch {
    /* some browsers throw if the tab isn't in a state that allows this — fail quietly */
  }
}