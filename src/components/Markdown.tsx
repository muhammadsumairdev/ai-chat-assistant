import { memo, useState, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/cn'

// Reconstruct raw text from rehype-highlight's nested spans, for the copy button.
function nodeToString(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeToString).join('')
  if (typeof node === 'object' && 'props' in node) {
    return nodeToString((node as { props: { children?: ReactNode } }).props.children)
  }
  return ''
}

function CodeBlock({
  lang,
  className,
  children,
}: {
  lang?: string
  className?: string
  children: ReactNode
}) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(nodeToString(children).replace(/\n$/, ''))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked */
    }
  }
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-border bg-[#0a0d14]">
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
          {lang || 'code'}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-white/5 hover:text-text"
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="copied"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5 text-cyan"
              >
                <Check size={13} /> Copied
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5"
              >
                <Copy size={13} /> Copy
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 text-[13px] leading-relaxed">
        <code className={cn('font-mono', className)}>{children}</code>
      </pre>
    </div>
  )
}

export const Markdown = memo(function Markdown({
  content,
  streaming = false,
}: {
  content: string
  streaming?: boolean
}) {
  return (
    <div className={cn('markdown', streaming && 'streaming')}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children, ...props }) => {
            const text = nodeToString(children)
            const isBlock = /language-/.test(className || '') || text.includes('\n')
            if (!isBlock) {
              return (
                <code
                  className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-accent"
                  {...props}
                >
                  {children}
                </code>
              )
            }
            const lang = /language-(\w+)/.exec(className || '')?.[1]
            return (
              <CodeBlock lang={lang} className={className}>
                {children}
              </CodeBlock>
            )
          },
          a: ({ children, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noreferrer"
              className="text-accent underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="md-table-wrap">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})
