import { Label } from "@/shared/ui/label";
import { CardDescription, CardTitle, CardHeader } from "@/shared/ui/card";
import { Switch } from "@/shared/ui/switch";

export function SectionHeader({
  icon,
  title,
  description,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <CardHeader className={`pb-4 ${className}`}>
      <div className="flex items-center gap-4">
        {/* Icon wrapper: uses primary/10 opacity for background */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <CardTitle className="text-base font-semibold text-foreground">
            {title}
          </CardTitle>
          <CardDescription className="mt-1 text-xs font-medium text-muted-foreground">
            {description}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}

export function SectionBox({ children }: { children: React.ReactNode }) {
  return (
    // Uses 'bg-muted/50' which is light gray in light mode, dark gray in dark mode
    <div className="rounded-xl border border-border bg-muted/40 p-6">
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <div className="text-sm font-medium text-foreground">
          {title}
        </div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}