import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function CodePreview({
  filePath,
  content
}: {
  filePath?: string;
  content?: string;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <p className="section-title">Code Preview</p>
          <h3 className="mt-2 text-lg font-semibold text-text">{filePath ?? "Select a file"}</h3>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto rounded-xl bg-[#111827] p-4 text-sm text-white">
          <code>{content ?? "// Select a file to inspect the code preview."}</code>
        </pre>
      </CardContent>
    </Card>
  );
}
