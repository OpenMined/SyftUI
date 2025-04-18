"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Toolbar } from "@/components/ui/toolbar";
import { FileActions } from "@/components/workspace/file-toolbar/file-actions";
import { ViewToggle } from "@/components/workspace/file-toolbar/view-toggle";
import { useState } from "react";

interface FileToolbarProps {
  // TODO remove after testing
  // sidebarOpen?: boolean
  // setSidebarOpen?: (open: boolean) => void
  onSearch?: (query: string) => void;
}

export function FileToolbar({ onSearch }: FileToolbarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  // Custom search input with icon
  const searchInput = (
    <div className="relative hidden sm:block">
      <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
      <Input
        type="search"
        placeholder="Search files..."
        className="w-40 pl-8 md:w-64"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );

  return (
    <Toolbar leftSection={<FileActions />} rightSection={<ViewToggle />}>
      {searchInput}
    </Toolbar>
  );
}
