import JsonView from "@uiw/react-json-view";
import { ChevronDown, ChevronRight } from "lucide-react";
import { memo } from "react";
import { jsonViewTheme } from "../../theme/json-view-theme";
import { observer } from "@legendapp/state/react";

interface CollapsibleHeaderProps {
  isOpen: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const CollapsibleHeader = observer(
  ({ isOpen, onClick, children }: CollapsibleHeaderProps) => (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:bg-accent/50 w-full text-left border-t border-border"
    >
      {isOpen ? (
        <ChevronDown className="h-3 w-3" />
      ) : (
        <ChevronRight className="h-3 w-3" />
      )}
      {children}
    </button>
  ),
);

const MemoizedJsonView = memo(
  ({ value }: { value: any }) => (
    <JsonView
      value={value}
      displayDataTypes={false}
      collapsed={2}
      displayObjectSize={false}
      enableClipboard={false}
      style={jsonViewTheme}
    />
  ),
  (prevProps, nextProps) => {
    return JSON.stringify(prevProps.value) === JSON.stringify(nextProps.value);
  },
);

interface CellOutputProps {
  output: { logs?: string[]; result?: any };
  showLogs: boolean;
  showOutput: boolean;
  onToggleLogs: () => void;
  onToggleOutput: () => void;
}

export const CellOutput = observer(
  ({
    output,
    showLogs,
    showOutput,
    onToggleLogs,
    onToggleOutput,
  }: CellOutputProps) => {
    return (
      <div className="flex flex-col">
        {output.logs && output.logs.length > 0 && (
          <>
            <CollapsibleHeader isOpen={showLogs} onClick={onToggleLogs}>
              Console Output ({output.logs.length} lines)
            </CollapsibleHeader>
            {showLogs && (
              <div className="flex-1 px-2 py-1 font-mono text-xs bg-background text-foreground">
                {output.logs.map((log: string, i: number) => (
                  <div
                    key={`${i}-${log}`}
                    className="whitespace-pre-wrap opacity-75"
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {output.result !== undefined && output.result !== null && (
          <>
            <CollapsibleHeader isOpen={showOutput} onClick={onToggleOutput}>
              Result
            </CollapsibleHeader>
            {showOutput && (
              <div className="flex-1 p-2 font-mono text-xs bg-background text-foreground">
                <MemoizedJsonView value={output.result} />
              </div>
            )}
          </>
        )}
      </div>
    );
  },
);
