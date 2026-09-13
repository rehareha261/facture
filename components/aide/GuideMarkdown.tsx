"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import Link from "next/link";

interface GuideMarkdownProps {
  content: string;
}

export function GuideMarkdown({ content }: GuideMarkdownProps) {
  return (
    <article className="guide-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={{
          h1: ({ children, id }) => (
            <h1 id={id} className="mb-4 mt-8 scroll-mt-20 text-2xl font-bold text-zinc-900 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children, id }) => (
            <h2 id={id} className="mb-3 mt-10 scroll-mt-20 border-b border-zinc-200 pb-2 text-xl font-semibold text-zinc-900">
              {children}
            </h2>
          ),
          h3: ({ children, id }) => (
            <h3 id={id} className="mb-2 mt-6 scroll-mt-20 text-lg font-semibold text-zinc-800">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-4 leading-relaxed text-zinc-700">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-4 list-disc space-y-1 pl-6 text-zinc-700">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-1 pl-6 text-zinc-700">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-zinc-900">{children}</strong>,
          a: ({ href, children }) => {
            const isInternal = href?.startsWith("#");
            if (isInternal) {
              return (
                <a href={href} className="font-medium text-blue-600 hover:underline">
                  {children}
                </a>
              );
            }
            if (href?.startsWith("/")) {
              return (
                <Link href={href} className="font-medium text-blue-600 hover:underline">
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                {children}
              </a>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-4 border-blue-200 bg-blue-50/50 py-2 pl-4 text-zinc-700">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-8 border-zinc-200" />,
          table: ({ children }) => (
            <div className="mb-6 overflow-x-auto rounded-lg border border-zinc-200">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-zinc-50">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-zinc-100 bg-white">{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-semibold text-zinc-700">{children}</th>
          ),
          td: ({ children }) => <td className="px-4 py-2 text-zinc-600">{children}</td>,
          code: ({ className, children }) => {
            const isMermaid = className?.includes("language-mermaid");
            if (isMermaid) {
              return (
                <div className="mb-4 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
                  Schéma de flux — suivez les étapes décrites dans le texte ci-dessus.
                </div>
              );
            }
            const isBlock = className?.startsWith("language-");
            if (isBlock) {
              return (
                <pre className="mb-4 overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-100">
                  <code>{children}</code>
                </pre>
              );
            }
            return (
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm text-zinc-800">{children}</code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
