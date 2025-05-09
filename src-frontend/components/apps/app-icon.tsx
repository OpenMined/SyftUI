import { cn } from "@/lib/utils";

export function AppIcon({ name }: { name: string }) {
  // Create a unique but consistent initial for each app
  const initial = name.charAt(0).toUpperCase();
  const firstCharAscii = name.charCodeAt(0);

  // Create a deterministic but varied color for each app
  const bgColors = [
    "bg-rose-100 text-rose-700",
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-green-100 text-green-700",
    "bg-yellow-100 text-yellow-700",
    "bg-pink-100 text-pink-700",
  ];

  const colorClass = bgColors[firstCharAscii % bgColors.length];

  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium",
        colorClass,
      )}
    >
      {initial}
    </div>
  );
}
