import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export default function SearchBar({ placeholder = "TCAR番号、顧客名、不具合名で検索...", onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-9"
        data-testid="input-search"
      />
    </div>
  );
}
