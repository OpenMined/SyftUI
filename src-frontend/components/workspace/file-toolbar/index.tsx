"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Toolbar } from "@/components/ui/toolbar";
import { FileActions } from "@/components/workspace/file-toolbar/file-actions";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileToolbarProps {
  onSearch?: (query: string) => void;
}

export function FileToolbar({ onSearch }: FileToolbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  // Handle clicking outside to collapse search
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest("[data-search-toggle]")
      ) {
        setIsSearchExpanded(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  // Toggle search expansion
  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };

  // Collapsible search input
  const collapsibleSearch = (
    <div className="relative flex items-center">
      {/* Search icon button (visible when collapsed) */}
      {!isSearchExpanded && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={toggleSearch}
          data-search-toggle
        >
          <Search className="h-4 w-4" />
        </Button>
      )}

      {/* Expanded search input */}
      <div
        className={cn(
          "absolute right-0 flex items-center transition-all duration-200 ease-in-out",
          isSearchExpanded
            ? "w-64 scale-100 opacity-100"
            : "pointer-events-none w-0 scale-95 opacity-0",
        )}
      >
        <div className="relative w-full">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Search files..."
            className="w-full pr-8 pl-8"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-1 right-0 h-8 w-8 p-0"
            onClick={() => setIsSearchExpanded(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Toolbar leftSection={<FileActions />} rightSection={collapsibleSearch}>
      {/* Center content here if needed */}
    </Toolbar>
  );
}
