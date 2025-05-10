"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Download,
  Info,
  RefreshCcw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BackgroundGradients } from "@/components/logo/background-gradients";
import { IconGhost } from "@/components/logo/icon-ghost";
import {
  parseAsString,
  parseAsStringEnum,
  parseAsInteger,
  useQueryState,
} from "nuqs";

enum Type {
  checking = "checking",
  none = "none",
  available = "available",
  downloading = "downloading",
  error = "error",
  failed = "failed",
}

type UpdateWindowState = {
  updateWindowType: Type;
  version: string;
  currentVersion: string;
  releaseNotes: string;
  error: string;
  progress: number;
};

export default function UpdatePage() {
  const [type, setType] = useQueryState(
    "type",
    parseAsStringEnum<Type>(Object.values(Type)),
  );
  const [version, setVersion] = useQueryState("version", parseAsString);
  const [currentVersion, setCurrentVersion] = useQueryState(
    "current_version",
    parseAsString,
  );
  const [releaseNotes, setReleaseNotes] = useQueryState(
    "release_notes",
    parseAsString,
  );
  const [error, setError] = useQueryState("error", parseAsString);
  const [progress, setProgress] = useQueryState("progress", parseAsInteger);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const { openPath } =
    typeof window !== "undefined" && typeof window.__TAURI__ !== "undefined"
      ? window.__TAURI__.opener
      : { openPath: (path: string) => window.open(path, "_blank") };

  useEffect(() => {
    const updateWindowStateListener = async () => {
      if (typeof window !== "undefined") {
        const appWebview =
          window.__TAURI__.webviewWindow.getCurrentWebviewWindow();
        const unlisten = await appWebview.listen<UpdateWindowState>(
          "update-window-state",
          (event) => {
            setType(event.payload.updateWindowType);
            setVersion(event.payload.version);
            setCurrentVersion(event.payload.currentVersion);
            setReleaseNotes(event.payload.releaseNotes);
            setError(event.payload.error);
            setProgress(event.payload.progress);
          },
        );

        return () => {
          unlisten();
        };
      }
    };

    updateWindowStateListener();
  }, [
    setType,
    setVersion,
    setCurrentVersion,
    setReleaseNotes,
    setError,
    setProgress,
  ]);

  useEffect(() => {
    if (type === "downloading") {
      setAnimatedProgress(progress);
    } else {
      setAnimatedProgress(0);
    }
  }, [progress, type]);

  const onUpdate = () => {
    setType("downloading");
    window.__TAURI__.core.invoke("update_window_response", {
      installUpdate: true,
    });
  };

  const onLater = () => {
    window.__TAURI__.core.invoke("update_window_response", {
      installUpdate: false,
    });
    closeHandler();
  };

  const closeHandler = () => {
    if (window.__TAURI__) {
      window.__TAURI__.window.getCurrentWindow().close();
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-row overflow-hidden select-none">
      {/* Left panel - Visual */}
      <div className="relative flex w-full flex-col justify-between p-8 md:w-2/5">
        <BackgroundGradients className="absolute top-0 left-0 h-full w-full" />
        <div className="absolute top-0 left-0 h-full w-full opacity-10">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          {/* SyftBox Logo */}
          <div className="flex items-center">
            <IconGhost width={60} height={60} />
            <div className="ml-3">
              <h1 className="text-3xl font-bold text-white">SyftBox</h1>
            </div>
          </div>

          <h2 className="mt-6 text-2xl font-bold text-white">
            The internet of private data
          </h2>
          <p className="mt-2 text-white/80">
            Secure, private, and decentralized data sharing for the modern web
          </p>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="flex items-center text-sm text-white/90">
            <div className="flex flex-col">
              <span>Current Version</span>
              <span className="font-mono font-bold">{currentVersion}</span>
            </div>
            {type === "available" && (
              <>
                <ArrowRight className="mx-4 text-white/50" />
                <div className="flex flex-col">
                  <span>New Version</span>
                  <span className="font-mono font-bold">{version}</span>
                </div>
              </>
            )}
          </div>
        </div>
        <div
          data-tauri-drag-region
          className="absolute top-0 right-0 bottom-0 left-0 z-20"
        ></div>
      </div>

      {/* Right panel - Content */}
      <div className="bg-primary-foreground flex max-h-screen w-full flex-col md:w-3/5">
        <div className="relative flex items-start justify-between border-b p-6">
          <div
            data-tauri-drag-region
            className="absolute top-0 right-0 bottom-0 left-0 z-20"
          ></div>
          <AnimatePresence mode="wait">
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {type === "available" && (
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-primary text-xl font-bold">
                      Update Available
                    </h3>
                    <p className="text-muted-foreground">
                      SyftBox {version} is ready to install
                    </p>
                  </div>
                </div>
              )}

              {type === "none" && (
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-primary text-xl font-bold">
                      You&apos;re Up To Date
                    </h3>
                    <p className="text-muted-foreground">
                      SyftBox {currentVersion} is the latest version
                    </p>
                  </div>
                </div>
              )}

              {type === "error" && (
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-primary text-xl font-bold">
                      Update Check Failed
                    </h3>
                    <p className="text-muted-foreground">
                      We couldn&apos;t check for updates
                    </p>
                  </div>
                </div>
              )}

              {type === "downloading" && (
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-primary text-xl font-bold">
                      Downloading Update
                    </h3>
                    <p className="text-muted-foreground">
                      SyftBox {version} is being downloaded
                    </p>
                  </div>
                </div>
              )}

              {type === "failed" && (
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-primary text-xl font-bold">
                      Update Failed
                    </h3>
                    <p className="text-muted-foreground">
                      We couldn&apos;t install the update
                    </p>
                  </div>
                </div>
              )}

              {type === "checking" && (
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <RefreshCcw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-primary text-xl font-bold">
                      Checking for Updates
                    </h3>
                    <p className="text-muted-foreground">
                      Looking for the latest version of SyftBox
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          className={cn(
            "flex-1 overflow-y-auto p-6",
            type === "downloading"
              ? "flex flex-col items-center justify-center"
              : "",
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={type}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {type === "available" && releaseNotes && (
                <div className="prose prose-sm dark:prose-invert max-w-none select-auto">
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (href) openPath(href);
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {decodeURIComponent(releaseNotes)}
                  </Markdown>
                </div>
              )}

              {type === "error" && error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                  <p className="break-words text-red-800 dark:text-red-300">
                    {decodeURIComponent(error)}
                  </p>
                </div>
              )}

              {type === "failed" && error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                  <p className="break-words text-red-800 dark:text-red-300">
                    {decodeURIComponent(error)}
                  </p>
                </div>
              )}

              {type === "downloading" && (
                <div className="mx-auto w-full max-w-md text-center">
                  <div className="relative w-full pt-1">
                    <div className="flex h-2 overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900/30">
                      <motion.div
                        className="bg-blue-500"
                        initial={{ width: "0%" }}
                        animate={{ width: `${animatedProgress}%` }}
                        transition={{ duration: 0.5 }}
                      ></motion.div>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-4">
                    Downloading SyftBox {version}... {animatedProgress}%
                  </p>
                  <div className="mt-6 flex justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                    >
                      <RefreshCcw className="h-6 w-6 text-blue-500" />
                    </motion.div>
                  </div>
                </div>
              )}

              {type === "none" && (
                <div className="overflow-hidden py-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                    }}
                  >
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                  </motion.div>
                  <h3 className="text-primary mt-6 text-xl font-medium">
                    You&apos;re all set!
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    SyftBox {currentVersion} is the latest version available.
                  </p>
                </div>
              )}

              {type === "checking" && (
                <div className="overflow-hidden py-6 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  >
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <RefreshCcw className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                    </div>
                  </motion.div>
                  <h3 className="text-primary mt-6 text-xl font-medium">
                    Checking for updates...
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Please wait while we check for the latest version.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          data-tauri-drag-region
          className="flex justify-end gap-3 border-t p-6"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              data-tauri-drag-region
              className="flex w-full justify-end gap-3"
            >
              {type === "available" && (
                <>
                  <Button variant="outline" onClick={onLater}>
                    Remind Me Later
                  </Button>
                  <Button onClick={onUpdate}>Update Now</Button>
                </>
              )}

              {(type === "none" || type === "error" || type === "failed") && (
                <Button onClick={closeHandler}>Close</Button>
              )}

              {type === "downloading" && (
                <Button disabled className="cursor-not-allowed opacity-50">
                  Downloading...
                </Button>
              )}

              {type === "checking" && (
                <Button disabled className="cursor-not-allowed opacity-50">
                  Checking...
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
