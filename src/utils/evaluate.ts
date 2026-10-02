/**
 * Safe arithmetic evaluator for the quick calculator.
 * Grammar: expr := term (('+'|'-') term)*, term := unary (('×'|'÷') unary)*,
 * unary := '-' unary | atom '%'*, atom := number | '(' expr ')'
 * Returns null for an incomplete or invalid expression.
 */
export function evaluate(input: string): number | null {
  const src = input.replace(/\s+/g, '');
  let i = 0;

  const peek = () => src[i];

  function expr(): number {
    let value = term();
    while (peek() === '+' || peek() === '−') {
      const op = src[i++];
      const rhs = term();
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }

  function term(): number {
    let value = unary();
    while (peek() === '×' || peek() === '÷') {
      const op = src[i++];
      const rhs = unary();
      value = op === '×' ? value * rhs : value / rhs;
    }
    return value;
  }

  function unary(): number {
    if (peek() === '−') {
      i++;
      return -unary();
    }
    let value = atom();
    while (peek() === '%') {
      i++;
      value /= 100;
    }
    return value;
  }

  function atom(): number {
    if (peek() === '(') {
      i++;
      const value = expr();
      if (peek() !== ')') {
        throw new Error('missing )');
      }
      i++;
      return value;
    }
    const start = i;
    while (i < src.length && /[0-9.]/.test(src[i])) {
      i++;
    }
    const text = src.slice(start, i);
    if (text === '' || text === '.' || (text.match(/\./g) ?? []).length > 1) {
      throw new Error('number expected');
    }
    return parseFloat(text);
  }

  try {
    if (src === '') {
      return null;
    }
    const result = expr();
    if (i !== src.length || !Number.isFinite(result)) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
}
