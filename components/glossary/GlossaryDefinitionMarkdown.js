import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function GlossaryDefinitionMarkdown({ content }) {
  if (!content) return null
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => {
          const isInternal = href?.startsWith('/')
          return isInternal ? (
            <a href={href} className="text-[#0A3D5C] underline hover:text-[#C49B38]">{children}</a>
          ) : (
            <a href={href} target="_blank" rel="noopener noreferrer"
              className="text-[#0A3D5C] underline hover:text-[#C49B38]">{children}</a>
          )
        }
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
