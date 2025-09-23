/**
 * Create an object composed of the picked object properties
 * @param object - The source object
 * @param keys - The list of keys to pick
 * @returns A new object containing only the picked keys
 */
function pick<T extends object, K extends keyof T>(object: T, keys: K[]): Pick<T, K> {
  return keys.reduce(
    (obj, key) => {
      if (object && Object.prototype.hasOwnProperty.call(object, key)) {
        // eslint-disable-next-line security/detect-object-injection
        obj[key] = object[key];
      }
      return obj;
    },
    {} as Pick<T, K>
  );
}

export default pick;
