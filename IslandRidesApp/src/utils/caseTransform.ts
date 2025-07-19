export function toCamelCase(str: string): string {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
}

export function toSnakeCase(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

export function transformKeys<T>(obj: T, transform: (key: string) => string): T {
  if (Array.isArray(obj)) {
    return obj.map(v => transformKeys(v, transform)) as T;
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const value = (obj as Record<string, unknown>)[key];
      const newKey = transform(key);
      (result as Record<string, unknown>)[newKey] = transformKeys(value, transform);
      return result;
    }, {} as Record<string, unknown>) as T;
  }
  
  return obj;
}

export function transformToCamelCase<T>(data: T): T {
  return transformKeys(data, toCamelCase);
}

export function transformToSnakeCase<T>(data: T): T {
  return transformKeys(data, toSnakeCase);
}
