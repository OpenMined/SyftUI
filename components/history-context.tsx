"use client"

import type React from "react"
import { createContext, useContext, useReducer, useCallback } from "react"
import type { FileSystemItem } from "@/lib/types"

type Operation =
  | { type: "CREATE_FOLDER"; folder: FileSystemItem; path: string[] }
  | { type: "DELETE"; items: FileSystemItem[]; path: string[] }
  | { type: "RENAME"; item: FileSystemItem; oldName: string; newName: string; path: string[] }
  | { type: "MOVE"; items: FileSystemItem[]; sourcePath: string[]; targetPath: string[] }
  | { type: "COPY"; items: FileSystemItem[]; sourcePath: string[]; targetPath: string[] }
  | { type: "UPLOAD"; files: FileSystemItem[]; path: string[] }

interface HistoryState {
  past: Operation[]
  future: Operation[]
}

interface HistoryContextType {
  canUndo: boolean
  canRedo: boolean
  addOperation: (operation: Operation) => void
  undo: () => Operation | undefined
  redo: () => Operation | undefined
  clearHistory: () => void
}

type HistoryAction =
  | { type: "ADD_OPERATION"; operation: Operation }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR" }

const historyReducer = (state: HistoryState, action: HistoryAction): HistoryState => {
  switch (action.type) {
    case "ADD_OPERATION":
      return {
        past: [...state.past, action.operation],
        future: [],
      }
    case "UNDO":
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      return {
        past: state.past.slice(0, -1),
        future: [previous, ...state.future],
      }
    case "REDO":
      if (state.future.length === 0) return state
      const next = state.future[0]
      return {
        past: [...state.past, next],
        future: state.future.slice(1),
      }
    case "CLEAR":
      return {
        past: [],
        future: [],
      }
    default:
      return state
  }
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined)

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(historyReducer, { past: [], future: [] })

  const addOperation = useCallback((operation: Operation) => {
    dispatch({ type: "ADD_OPERATION", operation })
  }, [])

  const undo = useCallback(() => {
    if (state.past.length === 0) return undefined
    dispatch({ type: "UNDO" })
    return state.past[state.past.length - 1]
  }, [state.past])

  const redo = useCallback(() => {
    if (state.future.length === 0) return undefined
    dispatch({ type: "REDO" })
    return state.future[0]
  }, [state.future])

  const clearHistory = useCallback(() => {
    dispatch({ type: "CLEAR" })
  }, [])

  return (
    <HistoryContext.Provider
      value={{
        canUndo: state.past.length > 0,
        canRedo: state.future.length > 0,
        addOperation,
        undo,
        redo,
        clearHistory,
      }}
    >
      {children}
    </HistoryContext.Provider>
  )
}

export function useHistory() {
  const context = useContext(HistoryContext)
  if (context === undefined) {
    throw new Error("useHistory must be used within a HistoryProvider")
  }
  return context
}

