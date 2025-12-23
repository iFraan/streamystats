"use client";

import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Info,
  Loader2,
  Upload,
} from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  type ImportState,
  importFromPlaybackReporting,
} from "@/lib/importPlaybackReporting";

// Form submit button with loading state
function SubmitButton({
  hasFile,
  disabled,
}: {
  hasFile: boolean;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || !hasFile || disabled}
      className="w-full"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Uploading...
        </>
      ) : (
        <>
          <Upload className="mr-2 h-4 w-4" />
          Upload and Import
        </>
      )}
    </Button>
  );
}

interface PlaybackReportingImportProps {
  serverId: number;
  lastSyncCompleted: Date | null;
}

export default function PlaybackReportingImport({
  serverId,
  lastSyncCompleted,
}: PlaybackReportingImportProps) {
  const hasCompletedInitialSync = lastSyncCompleted !== null;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, formAction] = useActionState(importFromPlaybackReporting, {
    type: null,
    message: "",
  } as ImportState);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (
        file.type === "application/json" ||
        file.name.endsWith(".json") ||
        file.type === "text/tab-separated-values" ||
        file.name.endsWith(".tsv") ||
        file.name.endsWith(".txt")
      ) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } else {
      setSelectedFile(null);
    }
  };

  // Reset the form after a successful upload
  useEffect(() => {
    if (state.type === "success" && fileInputRef.current) {
      setSelectedFile(null);
      fileInputRef.current.value = "";
    }
  }, [state]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">
          Import from Playback Reporting
        </CardTitle>
        <CardDescription>
          Import your playback history from a Playback Reporting export file
          (JSON or TSV format). Sessions will be imported even if some user or
          item data is missing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={formAction}
          className="space-y-4 flex flex-col items-start"
        >
          {/* Hidden input for server ID */}
          <input type="hidden" name="serverId" value={serverId} />

          <div className="space-y-2 flex flex-col">
            <label
              htmlFor="playback-reporting-file"
              className="text-sm font-medium"
            >
              Playback Reporting Export File
            </label>
            <Input
              ref={fileInputRef}
              id="playback-reporting-file"
              name="file"
              type="file"
              accept=".json,application/json,.tsv,text/tab-separated-values,.txt"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected file: {selectedFile.name} (
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {state?.type && (
            <Alert variant={state.type === "error" ? "destructive" : "default"}>
              {state.type === "success" && <CheckCircle2 className="h-4 w-4" />}
              {state.type === "error" && <AlertCircle className="h-4 w-4" />}
              {state.type === "info" && <Info className="h-4 w-4" />}
              <AlertTitle>
                {state.type === "success" && "Success"}
                {state.type === "error" && "Error"}
                {state.type === "info" && "Information"}
              </AlertTitle>
              <AlertDescription>
                {state.message}
                {state.type === "success" &&
                  state.importedCount !== undefined &&
                  state.totalCount !== undefined && (
                    <div className="mt-2 text-sm space-y-2">
                      <p>
                        Successfully imported {state.importedCount} of{" "}
                        {state.totalCount} sessions.
                      </p>
                      {((state.skippedCount && state.skippedCount > 0) ||
                        (state.errorCount && state.errorCount > 0)) && (
                        <p className="text-orange-600 dark:text-orange-400">
                          {state.skippedCount || 0} skipped,{" "}
                          {state.errorCount || 0} failed.
                        </p>
                      )}
                      {state.errors && state.errors.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Show details ({state.errors.length} issues
                            {state.errors.length === 50
                              ? ", showing first 50"
                              : ""}
                            )
                          </summary>
                          <ul className="mt-2 max-h-48 overflow-y-auto text-xs space-y-1 bg-muted/50 p-2 rounded">
                            {state.errors.map((err, i) => (
                              <li key={i} className="text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  {err.reason}
                                </span>
                                {err.itemName && (
                                  <span className="ml-1">- {err.itemName}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col items-start justify-start">
            <SubmitButton
              hasFile={!!selectedFile}
              disabled={!hasCompletedInitialSync}
            />
          </div>
        </form>

        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="instructions">
            <AccordionTrigger className="flex items-center text-sm font-medium">
              <HelpCircle className="mr-2 h-4 w-4" />
              How to export data from Playback Reporting
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-sm text-muted-foreground space-y-2 pt-2 pl-1">
                <ol className="list-decimal pl-5 space-y-1.5">
                  <li>Open your Jellyfin admin dashboard</li>
                  <li>Go to the Playback Reporting plugin settings</li>
                  <li>Click on Save Backup Data under the Backup section</li>
                  <li>Download the exported file</li>
                  <li>Upload it here</li>
                </ol>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
