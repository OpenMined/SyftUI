"use client";

import { AlertCircle, CheckCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type AnnouncementBarVariant = "info" | "success" | "warning" | "danger";

interface AnnouncementBarProps {
  /** The content to display in the announcement bar */
  children: ReactNode;
  /** The visual style variant of the announcement bar */
  variant?: AnnouncementBarVariant;
  /** Optional icon to display. If true, uses default icon for variant. If ReactNode, uses custom icon. */
  icon?: boolean | ReactNode;
  /** Whether to show the close button */
  dismissible?: boolean;
  /** Function called when the close button is clicked */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
}

const variantStyles: Record<
  AnnouncementBarVariant,
  {
    light: string;
    dark: string;
    icon: ReactNode;
  }
> = {
  info: {
    light: "bg-blue-50 text-blue-800 border-blue-200",
    dark: "dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-900/60",
    icon: <Info className="h-4 w-4" />,
  },
  success: {
    light: "bg-green-50 text-green-800 border-green-200",
    dark: "dark:bg-green-950/50 dark:text-green-200 dark:border-green-900/60",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  warning: {
    light: "bg-yellow-50 text-yellow-800 border-yellow-200",
    dark: "dark:bg-yellow-950/50 dark:text-yellow-200 dark:border-yellow-900/60",
    icon: <AlertCircle className="h-4 w-4" />,
  },
  danger: {
    light: "bg-red-50 text-red-800 border-red-200",
    dark: "dark:bg-red-950/50 dark:text-red-200 dark:border-red-900/60",
    icon: <AlertCircle className="h-4 w-4" />,
  },
};

/**
 * A flexible, accessible announcement bar component that displays important messages across the top of the page.
 * The component supports multiple visual variants, custom content, and dismissal functionality.
 *
 * @component AnnouncementBar
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The content to display in the announcement bar
 * @param {'info' | 'success' | 'warning' | 'danger'} [props.variant='info'] - The visual style variant of the announcement bar
 * @param {boolean | React.ReactNode} [props.icon=true] - Optional icon to display. If true, uses default icon for variant. If ReactNode, uses custom icon.
 * @param {boolean} [props.dismissible=false] - Whether to show the close button
 * @param {() => void} [props.onDismiss] - Function called when the close button is clicked
 * @param {string} [props.className] - Additional CSS classes to apply to the component
 *
 * @example Basic usage
 * ```tsx
 * // Simple informational announcement
 * <AnnouncementBar variant="info">
 *   This is an informational message.
 * </AnnouncementBar>
 *
 * // Success message
 * <AnnouncementBar variant="success">
 *   Your changes have been successfully saved!
 * </AnnouncementBar>
 *
 * // Warning announcement
 * <AnnouncementBar variant="warning">
 *   This is a mocked version of the dashboard. The real version with full functionality is coming soon.
 * </AnnouncementBar>
 *
 * // Danger/error announcement
 * <AnnouncementBar variant="danger">
 *   Your session is about to expire. Please save your work.
 * </AnnouncementBar>
 * ```
 *
 * @example Dismissible announcements
 * ```tsx
 * const [showAnnouncement, setShowAnnouncement] = useState(true);
 *
 * {showAnnouncement && (
 *   <AnnouncementBar
 *     variant="warning"
 *     dismissible
 *     onDismiss={() => setShowAnnouncement(false)}
 *   >
 *     This is a dismissible warning message.
 *   </AnnouncementBar>
 * )}
 * ```
 *
 * @example Custom icons
 * ```tsx
 * // Using a custom icon
 * import { Bell } from 'lucide-react';
 *
 * <AnnouncementBar variant="info" icon={<Bell className="h-4 w-4" />}>
 *   You have 3 new notifications
 * </AnnouncementBar>
 *
 * // No icon
 * <AnnouncementBar variant="success" icon={false}>
 *   All systems operational
 * </AnnouncementBar>
 * ```
 *
 * @example Custom styling
 * ```tsx
 * <AnnouncementBar
 *   variant="info"
 *   icon={<Megaphone className="h-4 w-4" />}
 *   className="bg-purple-50 text-purple-800 border-purple-100 dark:bg-purple-950/50 dark:text-purple-200 dark:border-purple-900/60"
 * >
 *   <span className="flex items-center gap-1">
 *     New feature announcement! Check out our{" "}
 *     <a href="#" className="underline font-semibold">
 *       latest updates
 *     </a>
 *     .
 *   </span>
 * </AnnouncementBar>
 * ```
 *
 * @example Rich content
 * ```tsx
 * <AnnouncementBar variant="danger" icon={<ShieldAlert className="h-4 w-4" />} className="justify-start">
 *   <div className="text-left">
 *     <div className="font-semibold">Security Alert</div>
 *     <div className="text-xs font-normal">We detected unusual activity on your account</div>
 *   </div>
 * </AnnouncementBar>
 * ```
 *
 * @example Custom indicators
 * ```tsx
 * <AnnouncementBar variant="success" icon={false}>
 *   <span className="flex items-center gap-2">
 *     <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
 *     All systems operational
 *   </span>
 * </AnnouncementBar>
 * ```
 *
 * @remarks
 * Variants:
 * - info: Blue styling, used for general information
 * - success: Green styling, used for success messages
 * - warning: Yellow styling, used for warnings
 * - danger: Red styling, used for errors or critical alerts
 *
 * Accessibility:
 * - Uses `role="alert"` to announce the content to screen readers
 * - Close button has an appropriate `aria-label`
 * - Focus management for the close button
 *
 * Best Practices:
 * 1. Use the appropriate variant for your message type
 * 2. Keep content concise - announcement bars work best with short, clear messages
 * 3. Consider making important announcements dismissible so users can remove them after reading
 * 4. Use sparingly - too many announcements can create alert fatigue
 * 5. For complex content, consider using a more robust component like a modal or dedicated page
 *
 * Animation:
 * The component includes a subtle fade-in animation by default. This can be customized
 * or disabled through the `className` prop.
 *
 * Browser Compatibility:
 * The component uses modern CSS features like Flexbox and CSS variables, which are supported
 * in all modern browsers. The Tailwind classes ensure consistent rendering across different
 * browsers and devices.
 *
 * @returns {JSX.Element} The AnnouncementBar component
 */
export function AnnouncementBar({
  children,
  variant = "info",
  icon = true,
  dismissible = false,
  onDismiss,
  className,
}: AnnouncementBarProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-center px-4 py-2",
        "animate-in fade-in border-b duration-300",
        styles.light,
        styles.dark,
        className,
      )}
      role="alert"
    >
      {icon && (
        <span className="mr-2 flex-shrink-0">
          {icon === true ? styles.icon : icon}
        </span>
      )}

      <div className="text-center text-sm font-medium">{children}</div>

      {dismissible && (
        <button
          onClick={onDismiss}
          className={cn(
            "absolute right-2 rounded-full p-1",
            "hover:bg-black/5 dark:hover:bg-white/10",
            "focus:ring-2 focus:ring-offset-1 focus:outline-none",
            "focus:ring-offset-transparent",
          )}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
