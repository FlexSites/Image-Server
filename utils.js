import path from 'path';
import url from 'url';

export function getPrefix(uri) {
  return path.dirname(getKey(uri));
}

export function getKey(uri) {
  return url.parse(uri, false, true).pathname.substr(1);
}

export function variation(name, src) {
  let { pathname } = url.parse(src, false, true);
  let { dir, ext } = path.parse(pathname);
  return (`${dir}/${name}${ext}`);
}
