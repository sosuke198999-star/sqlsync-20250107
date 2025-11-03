import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

interface FilterBarProps {
  onStatusChange?: (status: string) => void;
}

export default function FilterBar({ onStatusChange }: FilterBarProps) {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-wrap gap-4">
      <div className="space-y-2 min-w-[200px]">
        <Label htmlFor="filter-status" className="text-xs">{t('filter.status')}</Label>
        <Select onValueChange={onStatusChange}>
          <SelectTrigger id="filter-status" data-testid="select-filter-status">
            <SelectValue placeholder={t('filter.all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filter.all')}</SelectItem>
            <SelectItem value="PENDING_ACCEPTANCE">{t('status.PENDING_ACCEPTANCE')}</SelectItem>
            <SelectItem value="PENDING_COUNTERMEASURE">{t('status.PENDING_COUNTERMEASURE')}</SelectItem>
            <SelectItem value="COMPLETED">{t('status.COMPLETED')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
