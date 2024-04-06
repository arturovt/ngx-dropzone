/**
 * Coerces a data-bound value (typically a string) to a boolean.
 * Taken from https://github.com/angular/components/blob/main/src/cdk/coercion/boolean-property.ts
 */
export function coerceBooleanProperty(value: any): boolean {
  return value != null && `${value}` !== 'false';
}

/**
 * Whether the provided value is considered a number.
 * Taken from https://github.com/angular/components/blob/main/src/cdk/coercion/number-property.ts
 */
export function coerceNumberProperty(value: any): number;
export function coerceNumberProperty<D>(value: any, fallback: D): number | D;
export function coerceNumberProperty(value: any, fallbackValue = 0) {
  return _isNumberValue(value) ? Number(value) : fallbackValue;
}

/**
 * Whether the provided value is considered a number.
 */
function _isNumberValue(value: any): boolean {
  // parseFloat(value) handles most of the cases we're interested in (it treats null, empty string,
  // and other non-number values as NaN, where Number just uses 0) but it considers the string
  // '123hello' to be a valid number. Therefore we also check if Number(value) is NaN.
  return !isNaN(parseFloat(value as any)) && !isNaN(Number(value));
}
