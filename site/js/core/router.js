// Router pe hash: #/test/recap-c1-t1 → { name: 'test', params: ['recap-c1-t1'] }

export function currentRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [name = '', ...params] = hash.split('/').filter(Boolean);
  return { name, params: params.map(decodeURIComponent) };
}

export const go = (path) => {
  location.hash = `#/${path}`;
};

export function onRouteChange(handler) {
  addEventListener('hashchange', () => handler(currentRoute()));
  handler(currentRoute());
}
