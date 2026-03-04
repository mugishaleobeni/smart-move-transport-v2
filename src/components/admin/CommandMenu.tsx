import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
    Car,
    CalendarCheck,
    Search,
    Command as CommandIcon,
    LayoutDashboard,
    DollarSign,
    Receipt,
    BarChart3,
    FileText,
    Loader2,
} from "lucide-react";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { searchApi } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface SearchResult {
    id: string;
    type: "car" | "booking" | "nav";
    title: string;
    subtitle: string;
    url: string;
}

const navItems = [
    { title: "Dashboard", icon: LayoutDashboard, url: "/admin" },
    { title: "Cars", icon: Car, url: "/admin/cars" },
    { title: "Pricing", icon: DollarSign, url: "/admin/pricing" },
    { title: "Bookings", icon: CalendarCheck, url: "/admin/bookings" },
    { title: "Expenses", icon: Receipt, url: "/admin/expenses" },
    { title: "Analytics", icon: BarChart3, url: "/admin/analytics" },
    { title: "Reports", icon: FileText, url: "/admin/reports" },
];

export function CommandMenu({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
    const [query, setQuery] = React.useState("");
    const debouncedQuery = useDebounce(query, 300);
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const navigate = useNavigate();

    React.useEffect(() => {
        if (!debouncedQuery || debouncedQuery.length < 2) {
            setResults([]);
            return;
        }

        const performSearch = async () => {
            setIsLoading(true);
            try {
                const response = await searchApi.global(debouncedQuery);
                setResults(response.data);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        performSearch();
    }, [debouncedQuery]);

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(!open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [open, setOpen]);

    const runCommand = React.useCallback(
        (command: () => unknown) => {
            setOpen(false);
            command();
        },
        [setOpen]
    );

    const filteredNav = navItems.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder="Type a command or search..."
                value={query}
                onValueChange={setQuery}
            />
            <CommandList className="max-h-[400px]">
                <CommandEmpty>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                        </div>
                    ) : (
                        "No results found."
                    )}
                </CommandEmpty>

                {query.length > 0 && results.length > 0 && (
                    <CommandGroup heading="System Results">
                        {results.map((result) => (
                            <CommandItem
                                key={`${result.type}-${result.id}`}
                                value={result.title}
                                onSelect={() => runCommand(() => navigate(result.url))}
                                className="flex items-center gap-3 px-4 py-3"
                            >
                                <div className={cn(
                                    "p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800",
                                    result.type === 'car' ? 'text-blue-500' : 'text-emerald-500'
                                )}>
                                    {result.type === "car" ? <Car className="h-4 w-4" /> : <CalendarCheck className="h-4 w-4" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm">{result.title}</span>
                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                                        {result.subtitle}
                                    </span>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                <CommandSeparator />

                <CommandGroup heading="Navigation">
                    {filteredNav.map((item) => (
                        <CommandItem
                            key={item.url}
                            value={item.title}
                            onSelect={() => runCommand(() => navigate(item.url))}
                            className="flex items-center gap-3 px-4 py-2"
                        >
                            <item.icon className="h-4 w-4 text-primary" />
                            <span className="font-bold text-sm">{item.title}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
