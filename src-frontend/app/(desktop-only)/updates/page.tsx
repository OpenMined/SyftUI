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
import { useOpenPath } from "@/hooks/use-open-path";

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

const initialState: UpdateWindowState = {
  updateWindowType: Type.checking,
  version: "",
  currentVersion: "",
  releaseNotes: "",
  error: "",
  progress: 0,
};

export default function UpdatePage() {
  const [state, setState] = useState<UpdateWindowState>(initialState);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const { openPath } = useOpenPath();

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const updateWindowStateListener = async () => {
      if (
        typeof window !== "undefined" &&
        typeof window.__TAURI__ !== "undefined"
      ) {
        // Get initial state
        const initialState =
          await window.__TAURI__.core.invoke<UpdateWindowState>(
            "get_window_state",
          );
        setState(initialState);

        // Listen for further state updates
        const appWebview =
          window.__TAURI__.webviewWindow.getCurrentWebviewWindow();
        unlisten = await appWebview.listen<UpdateWindowState>(
          "update-window-state",
          (event: { payload: UpdateWindowState }) => {
            setState(event.payload);
          },
        );
      }
    };

    updateWindowStateListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  useEffect(() => {
    if (state.updateWindowType === "downloading") {
      setAnimatedProgress(state.progress);
    } else {
      setAnimatedProgress(0);
    }
  }, [state.progress, state.updateWindowType]);

  const onUpdate = (): void => {
    setState((prev) => ({ ...prev, updateWindowType: Type.downloading }));
    if (
      typeof window !== "undefined" &&
      typeof window.__TAURI__ !== "undefined"
    ) {
      window.__TAURI__.core.invoke("update_window_response", {
        installUpdate: true,
      });
    }
  };

  const onLater = (): void => {
    if (
      typeof window !== "undefined" &&
      typeof window.__TAURI__ !== "undefined"
    ) {
      window.__TAURI__.core.invoke("update_window_response", {
        installUpdate: false,
      });
    }
    closeHandler();
  };

  const closeHandler = (): void => {
    if (
      typeof window !== "undefined" &&
      typeof window.__TAURI__ !== "undefined"
    ) {
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
              <span className="font-mono font-bold">
                {state.currentVersion}
              </span>
            </div>
            {state.updateWindowType === "available" && (
              <>
                <ArrowRight className="mx-4 text-white/50" />
                <div className="flex flex-col">
                  <span>New Version</span>
                  <span className="font-mono font-bold">{state.version}</span>
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
              key={state.updateWindowType}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {state.updateWindowType === "available" && (
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-primary text-xl font-bold">
                      Update Available
                    </h3>
                    <p className="text-muted-foreground">
                      SyftBox {state.version} is ready to install
                    </p>
                  </div>
                </div>
              )}

              {state.updateWindowType === "none" && (
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-primary text-xl font-bold">
                      You&apos;re Up To Date
                    </h3>
                    <p className="text-muted-foreground">
                      SyftBox {state.currentVersion} is the latest version
                    </p>
                  </div>
                </div>
              )}

              {state.updateWindowType === "error" && (
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

              {state.updateWindowType === "downloading" && (
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-primary text-xl font-bold">
                      Downloading Update
                    </h3>
                    <p className="text-muted-foreground">
                      SyftBox {state.version} is being downloaded
                    </p>
                  </div>
                </div>
              )}

              {state.updateWindowType === "failed" && (
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

              {state.updateWindowType === "checking" && (
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
            state.updateWindowType === "downloading"
              ? "flex flex-col items-center justify-center"
              : "",
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={state.updateWindowType}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {state.updateWindowType === "available" && state.releaseNotes && (
                <div className="prose prose-sm dark:prose-invert max-w-none select-auto">
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: (props: {
                        href?: string;
                        children?: React.ReactNode;
                      }) => (
                        <a
                          href="#"
                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                            e.preventDefault();
                            if (props.href) openPath(props.href);
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {props.children}
                        </a>
                      ),
                    }}
                  >
                    {state.releaseNotes}
                  </Markdown>
                </div>
              )}

              {state.updateWindowType === "error" && state.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                  <p className="break-words text-red-800 dark:text-red-300">
                    {state.error}
                  </p>
                </div>
              )}

              {state.updateWindowType === "failed" && state.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                  <p className="break-words text-red-800 dark:text-red-300">
                    {state.error}
                  </p>
                </div>
              )}

              {state.updateWindowType === "downloading" && (
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
                    Downloading SyftBox {state.version}... {animatedProgress}%
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

              {state.updateWindowType === "none" && (
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
                    SyftBox {state.currentVersion} is the latest version
                    available.
                  </p>
                </div>
              )}

              {state.updateWindowType === "checking" && (
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
              key={state.updateWindowType}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              data-tauri-drag-region
              className="flex w-full justify-end gap-3"
            >
              {state.updateWindowType === "available" && (
                <>
                  <Button variant="outline" onClick={onLater}>
                    Remind Me Later
                  </Button>
                  <Button onClick={onUpdate}>Update Now</Button>
                </>
              )}

              {(state.updateWindowType === "none" ||
                state.updateWindowType === "error" ||
                state.updateWindowType === "failed") && (
                <Button onClick={closeHandler}>Close</Button>
              )}

              {state.updateWindowType === "downloading" && (
                <Button disabled className="cursor-not-allowed opacity-50">
                  Downloading...
                </Button>
              )}

              {state.updateWindowType === "checking" && (
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
