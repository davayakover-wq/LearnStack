import katex from 'katex';

type MathSegment =
  { kind: 'text'; value: string } | { kind: 'math'; value: string; display: boolean };

const DELIMITER_PATTERN = /(\$\$[^$]+?\$\$|\$[^$\n]+?\$)/g;

function splitSegments(text: string): MathSegment[] {
  return text
    .split(DELIMITER_PATTERN)
    .filter((part) => part.length > 0)
    .map((part) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        return { kind: 'math', value: part.slice(2, -2), display: true };
      }
      if (part.startsWith('$') && part.endsWith('$')) {
        return { kind: 'math', value: part.slice(1, -1), display: false };
      }
      return { kind: 'text', value: part };
    });
}

function renderExpression(expression: string, display: boolean): string {
  try {
    return katex.renderToString(expression, {
      throwOnError: false,
      displayMode: display,
    });
  } catch {
    return expression;
  }
}

// Renders inline `$...$` / block `$$...$$` LaTeX within otherwise plain
// admin-authored text (docs/02-ux-design-system.md: "Math notation renders
// via KaTeX"). Content here is always admin-authored, never raw end-user
// input, so injecting KaTeX's own generated markup is safe. Strings with no
// delimiters pass through unchanged, so existing English content renders
// identically to before this component existed.
export function MathText({ text }: { text?: string | null }) {
  if (!text) return null;

  const segments = splitSegments(text);
  if (!segments.some((s) => s.kind === 'math')) return <>{text}</>;

  return (
    <>
      {segments.map((segment, i) =>
        segment.kind === 'text' ? (
          <span key={i}>{segment.value}</span>
        ) : (
          <span
            key={i}
            dangerouslySetInnerHTML={{
              __html: renderExpression(segment.value, segment.display),
            }}
          />
        ),
      )}
    </>
  );
}
