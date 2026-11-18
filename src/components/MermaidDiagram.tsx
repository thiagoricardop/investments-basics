import React, { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  isDark: boolean;
}

// Serialize mermaid initialization and render calls so concurrent diagrams on a chapter never race.
let renderQueue: Promise<void> = Promise.resolve();

function cleanupOrphanMermaidNodes(specificId?: string): void {
  if (typeof document === 'undefined') return;
  if (specificId) {
    document.getElementById(specificId)?.remove();
    document.getElementById(`d${specificId}`)?.remove();
  }
  document
    .querySelectorAll('body > div[id^="dmermaid_"], body > div[id^="mermaid_"]')
    .forEach((node) => node.remove());
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, isDark }) => {
  const reactId = useId().replace(/:/g, '_');
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const uniqueId = `mermaid_${reactId}_${Math.random().toString(36).slice(2, 7)}`;

    const run = async () => {
      if (!active) return;
      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: isDark ? 'dark' : 'base',
          themeVariables: isDark
            ? {
                primaryColor: '#1e293b',
                primaryTextColor: '#f1f5f9',
                primaryBorderColor: '#475569',
                lineColor: '#94a3b8',
                secondaryColor: '#0f172a',
                tertiaryColor: '#1e293b',
                fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
              }
            : {
                primaryColor: '#f5f1e8',
                primaryTextColor: '#1c1917',
                primaryBorderColor: '#cfc6b6',
                lineColor: '#57534e',
                secondaryColor: '#fbf9f5',
                tertiaryColor: '#ece6da',
                fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
              },
        });

        try {
          const { svg: renderedSvg } = await mermaid.render(uniqueId, chart.trim());
          if (active) {
            setSvg(renderedSvg);
            setError(false);
          }
        } finally {
          cleanupOrphanMermaidNodes(uniqueId);
        }
      } catch {
        cleanupOrphanMermaidNodes(uniqueId);
        if (active) {
          setError(true);
        }
      }
    };

    renderQueue = renderQueue.then(run, run);

    return () => {
      active = false;
      cleanupOrphanMermaidNodes(uniqueId);
    };
  }, [chart, isDark, reactId]);

  if (error) {
    return (
      <pre className="my-6 overflow-x-auto rounded-lg border border-stone-200 dark:border-slate-800 bg-stone-100/70 dark:bg-slate-900 p-4 text-xs font-mono text-stone-700 dark:text-slate-300">
        {chart}
      </pre>
    );
  }

  return (
    <figure className="my-7 rounded-lg border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-[#141A22] p-4 sm:p-6">
      <div
        className="flex justify-center overflow-x-auto [&>svg]:max-w-full [&>svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </figure>
  );
};
