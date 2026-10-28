import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders user-written markdown safely (raw HTML is not rendered). */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-notes text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: linkChildren }) => (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow">
              {linkChildren}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
