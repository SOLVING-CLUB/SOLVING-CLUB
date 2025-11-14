

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { CalendarIcon, X, Filter, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { 
  GlobalTaskCategory, 
  GlobalTaskTag, 
  GlobalTaskFilters 
} from "@/lib/types/global-tasks";

interface GlobalTaskFiltersProps {
  categories: GlobalTaskCategory[];
  tags: GlobalTaskTag[];
  filters: GlobalTaskFilters;
  onFiltersChange: (filters: GlobalTaskFilters) => void;
}

export function GlobalTaskFilters({ categories, tags, filters, onFiltersChange }: GlobalTaskFiltersProps) {
  const [localFilters, setLocalFilters] = useState<GlobalTaskFilters>(filters);
  const [categorySearchOpen, setCategorySearchOpen] = useState(false);
  const [tagSearchOpen, setTagSearchOpen] = useState(false);
  const [assignedToSearchOpen, setAssignedToSearchOpen] = useState(false);

  const handleFilterChange = (key: keyof GlobalTaskFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleArrayFilterChange = (key: keyof GlobalTaskFilters, value: string, checked: boolean) => {
    const currentArray = (localFilters[key] as string[]) || [];
    const newArray = checked 
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value);
    
    const newFilters = { ...localFilters, [key]: newArray.length > 0 ? newArray : undefined };
    setLocalFilters(newFilters);
  };

  const handleDateFilterChange = (key: 'due_date_from' | 'due_date_to' | 'created_date_from' | 'created_date_to', date: Date | undefined) => {
    const newFilters = { 
      ...localFilters, 
      [key]: date ? date.toISOString().split('T')[0] : undefined 
    };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const resetFilters = () => {
    const emptyFilters: GlobalTaskFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    Object.values(localFilters).forEach(value => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          count += value.length;
        } else {
          count += 1;
        }
      }
    });
    return count;
  };

  const removeFilter = (key: keyof GlobalTaskFilters) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];
    setLocalFilters(newFilters);
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount}</Badge>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button size="sm" onClick={applyFilters}>
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {localFilters.status && (
            <Badge variant="outline" className="flex items-center space-x-1">
              <span>Status: {Array.isArray(localFilters.status) ? localFilters.status.join(', ') : localFilters.status}</span>
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('status')}
              />
            </Badge>
          )}
          {localFilters.priority && (
            <Badge variant="outline" className="flex items-center space-x-1">
              <span>Priority: {Array.isArray(localFilters.priority) ? localFilters.priority.join(', ') : localFilters.priority}</span>
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('priority')}
              />
            </Badge>
          )}
          {localFilters.category_id && (
            <Badge variant="outline" className="flex items-center space-x-1">
              <span>Category: {Array.isArray(localFilters.category_id) ? localFilters.category_id.length : 1} selected</span>
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('category_id')}
              />
            </Badge>
          )}
          {localFilters.search && (
            <Badge variant="outline" className="flex items-center space-x-1">
              <span>Search: {localFilters.search}</span>
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('search')}
              />
            </Badge>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div>
          <Label className="text-sm font-medium">Status</Label>
          <div className="space-y-2 mt-2">
            {['todo', 'in-progress', 'completed', 'cancelled', 'on-hold'].map((status) => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={(localFilters.status as string[])?.includes(status) || false}
                  onCheckedChange={(checked) => handleArrayFilterChange('status', status, !!checked)}
                />
                <Label htmlFor={`status-${status}`} className="text-sm capitalize">
                  {status.replace('-', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Filter */}
        <div>
          <Label className="text-sm font-medium">Priority</Label>
          <div className="space-y-2 mt-2">
            {['urgent', 'high', 'medium', 'low'].map((priority) => (
              <div key={priority} className="flex items-center space-x-2">
                <Checkbox
                  id={`priority-${priority}`}
                  checked={(localFilters.priority as string[])?.includes(priority) || false}
                  onCheckedChange={(checked) => handleArrayFilterChange('priority', priority, !!checked)}
                />
                <Label htmlFor={`priority-${priority}`} className="text-sm capitalize">
                  {priority}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <Label className="text-sm font-medium">Category</Label>
          <Popover open={categorySearchOpen} onOpenChange={setCategorySearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={categorySearchOpen}
                className="w-full justify-between mt-2"
              >
                Select categories...
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
              <CommandInput placeholder="Search categories..." />
                <CommandEmpty>No category found.</CommandEmpty>
                <CommandGroup>
                  {categories.map((category) => (
                    <CommandItem
                      key={category.id}
                      value={category.name}
                      onSelect={() => {
                        const isSelected = (localFilters.category_id as string[])?.includes(category.id) || false;
                        handleArrayFilterChange('category_id', category.id, !isSelected);
                      }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Tags Filter */}
        <div>
          <Label className="text-sm font-medium">Tags</Label>
          <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={tagSearchOpen}
                className="w-full justify-between mt-2"
              >
                Select tags...
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
              <CommandInput placeholder="Search tags..." />
                <CommandEmpty>No tag found.</CommandEmpty>
                <CommandGroup>
                  {tags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => {
                        const isSelected = (localFilters.tag_ids as string[])?.includes(tag.id) || false;
                        handleArrayFilterChange('tag_ids', tag.id, !isSelected);
                      }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Due Date Range */}
        <div>
          <Label className="text-sm font-medium">Due Date From</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-2",
                  !localFilters.due_date_from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localFilters.due_date_from ? (
                  format(new Date(localFilters.due_date_from), "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={localFilters.due_date_from ? new Date(localFilters.due_date_from) : undefined}
                onSelect={(date) => handleDateFilterChange('due_date_from', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label className="text-sm font-medium">Due Date To</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-2",
                  !localFilters.due_date_to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localFilters.due_date_to ? (
                  format(new Date(localFilters.due_date_to), "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={localFilters.due_date_to ? new Date(localFilters.due_date_to) : undefined}
                onSelect={(date) => handleDateFilterChange('due_date_to', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Additional Filters */}
        <div>
          <Label className="text-sm font-medium">Additional Filters</Label>
          <div className="space-y-2 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-dependencies"
                checked={localFilters.has_dependencies || false}
                onCheckedChange={(checked) => handleFilterChange('has_dependencies', checked ? true : undefined)}
              />
              <Label htmlFor="has-dependencies" className="text-sm">
                Has Dependencies
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-recurring"
                checked={localFilters.is_recurring || false}
                onCheckedChange={(checked) => handleFilterChange('is_recurring', checked ? true : undefined)}
              />
              <Label htmlFor="is-recurring" className="text-sm">
                Recurring Tasks
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
