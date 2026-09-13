// Router pe hash: #/test/recap-c1-t1 → { name: 'test', params: ['recap-c1-t1'] }

export function currentRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [name = '', ...params] = hash.split('/').filter(Boolean);
  return { name, params: params.map(decodeURIComponent) };
}

export const go = (path) => {
  location.hash = `#/${path}`;
};

/** Înlocuiește adresa curentă, fără o intrare nouă în istoric (de exemplu, pentru rutele de dinainte de teme). */
export const redirect = (path) => {
  location.replace(`#/${path}`);
};

/** Reîncarcă pagina curentă (după o ștergere, de exemplu), fără să schimbe adresa. */
export const refresh = () => dispatchEvent(new Event('hashchange'));

export function onRouteChange(handler) {
  addEventListener('hashchange', () => handler(currentRoute()));
  handler(currentRoute());
}
