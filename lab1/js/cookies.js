const COOKIE_LIFETIME_SECONDS = 60 * 60 * 24 * 365;


function setCookie(name, value, maxAge = COOKIE_LIFETIME_SECONDS) {
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    `max-age=${maxAge}`,
    'path=/',
    'samesite=Lax',
  ];

  document.cookie = attributes.join(';');
}

function getCookie(name) {
  const prefix = `${name}=`;
  const value = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix));

  return value ? decodeURIComponent(value.slice(prefix.length)) : null;
}

function deleteCookie(name) {
    const attributes = [
    `${name}=`,
    `max-age=0`,
    'path=/',
  ];
  document.cookie = attributes.join(';');
}
