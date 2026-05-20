import React from 'react'
import { cn } from '@/lib/utils'

export function MarkdownRenderer({ content, className }: { content: string; className?: string }) {
  const lines = content.split('\n')

  return (
    <div className={cn('space-y-2 text-sm text-slate-800 break-words', className)}>
      {lines.map((line, i) => {
        if (line.startsWith('# '))
          return (
            <h1 key={i} className="text-2xl font-bold mt-6 mb-2 text-slate-900 border-b pb-2">
              {line.replace('# ', '')}
            </h1>
          )
        if (line.startsWith('## '))
          return (
            <h2 key={i} className="text-xl font-semibold mt-5 mb-2 text-slate-800">
              {line.replace('## ', '')}
            </h2>
          )
        if (line.startsWith('### '))
          return (
            <h3 key={i} className="text-lg font-medium mt-4 mb-2 text-slate-700">
              {line.replace('### ', '')}
            </h3>
          )
        if (line.startsWith('- '))
          return (
            <li key={i} className="ml-4 list-disc marker:text-slate-400">
              {line.replace('- ', '')}
            </li>
          )
        if (!line.trim()) return <br key={i} />
        return (
          <p key={i} className="leading-relaxed">
            {line}
          </p>
        )
      })}
    </div>
  )
}
