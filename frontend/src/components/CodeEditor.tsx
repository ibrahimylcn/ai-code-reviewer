interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (code: string) => void;
}

export default function CodeEditor({ code, onChange }: CodeEditorProps) {
  return (
    <div className="relative">
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Kodunuzu buraya yapıştırın veya yazın..."
        className="w-full h-[600px] p-4 font-mono text-sm border-0 focus:outline-none resize-none bg-slate-900 text-slate-100 placeholder-slate-500"
        style={{ tabSize: 2 }}
        spellCheck={false}
      />
    </div>
  );
}

