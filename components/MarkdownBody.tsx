import ReactMarkdown from "react-markdown";

type Props = { content: string };

export function MarkdownBody({ content }: Props) {
  return (
    <article className="prose prose-stone prose-lg max-w-none prose-headings:font-display prose-a:text-accent prose-a:no-underline hover:prose-a:underline">
      <ReactMarkdown>{content}</ReactMarkdown>
    </article>
  );
}
