// src/utils/directoryUtils.js
export const findPath = (directories, dirId) => {
  const map = new Map();
  directories.forEach((dir) => {
    map.set(dir.id, dir);
    if (dir.children) {
      dir.children.forEach((child) =>
        map.set(child.id, { ...child, parent: dir })
      );
    }
  });

  const path = [];
  let current = map.get(dirId);
  while (current) {
    path.unshift(current);
    current = current.parent;
  }
  return path;
};
