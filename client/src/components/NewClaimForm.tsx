import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import FileUpload from "./FileUpload";
import { useTranslation } from "react-i18next";
import { Plus, X, Calendar as CalendarIcon } from "lucide-react";
import type { DcItem } from "@shared/schema";

interface NewClaimFormProps {
  onSubmit?: (data: ClaimFormData) => void | Promise<void>;
  onCancel?: () => void;
}

export interface ClaimFormData {
  customerDefectId: string;
  customerName: string;
  partNumber: string;
  dcItems: DcItem[];
  defectName: string;
  occurrenceDate: string;
  remarks: string;
  assignee: string;
  files: File[];
}

const defaultCustomerOptions = [
  "トヨタ自動車株式会社",
  "日産自動車株式会社",
  "ホンダ技研工業株式会社",
  "マツダ株式会社",
  "スバル株式会社",
  "三菱自動車工業株式会社",
  "ダイハツ工業株式会社",
  "スズキ株式会社",
];

export default function NewClaimForm({ onSubmit, onCancel }: NewClaimFormProps) {
  const { t } = useTranslation();
  const occurrenceRef = useRef<HTMLInputElement>(null);
  const [customerOptions] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('customerList') || '[]');
      return Array.isArray(saved) && saved.length > 0 ? saved : defaultCustomerOptions;
    } catch {
      return defaultCustomerOptions;
    }
  });
  const [formData, setFormData] = useState<ClaimFormData>({
    customerDefectId: '',
    customerName: '',
    partNumber: '',
    dcItems: [{ dc: '', quantity: 1 }],
    defectName: '',
    occurrenceDate: '',
    remarks: '',
    assignee: '',
    files: [],
  });

  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await Promise.resolve(onSubmit?.(formData));
      console.log('Form submitted:', formData);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const addDcItem = () => {
    setFormData({
      ...formData,
      dcItems: [...formData.dcItems, { dc: '', quantity: 1 }],
    });
  };

  const removeDcItem = (index: number) => {
    if (formData.dcItems.length > 1) {
      setFormData({
        ...formData,
        dcItems: formData.dcItems.filter((_, i) => i !== index),
      });
    }
  };

  const updateDcItem = (index: number, field: 'dc' | 'quantity', value: string | number) => {
    const newDcItems = [...formData.dcItems];
    newDcItems[index] = { ...newDcItems[index], [field]: value };
    setFormData({ ...formData, dcItems: newDcItems });
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t('newClaim.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('newClaim.subtitle')}</p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="customer-defect-id">
                {t('newClaim.customerDefectId')}
              </Label>
              <Input
                id="customer-defect-id"
                value={formData.customerDefectId}
                onChange={(e) => setFormData({ ...formData, customerDefectId: e.target.value })}
                placeholder="例: DEF-2025-001"
                data-testid="input-customer-defect-id"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-name">
                {t('newClaim.customerName')} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.customerName}
                onValueChange={(value) => setFormData({ ...formData, customerName: value })}
                required
              >
                <SelectTrigger id="customer-name" data-testid="select-customer-name">
                  <SelectValue placeholder={t('newClaim.selectCustomer')} />
                </SelectTrigger>
                <SelectContent>
                  {customerOptions.map((customer) => (
                    <SelectItem key={customer} value={customer}>
                      {customer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="part-number">
                {t('newClaim.partNumber')}
              </Label>
              <Input
                id="part-number"
                value={formData.partNumber}
                onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                placeholder="例: P-12345-A"
                data-testid="input-part-number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occurrence-date">
                {t('newClaim.occurrenceDate')}
              </Label>
              <div className="relative">
                <Input
                  id="occurrence-date"
                  type="date"
                  value={formData.occurrenceDate}
                  onChange={(e) => setFormData({ ...formData, occurrenceDate: e.target.value })}
                  data-testid="input-occurrence-date"
                  className="pr-10"
                  style={{ colorScheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' }}
                  ref={occurrenceRef}
                />
                <style>{`
                  /* Hide UA icon for consistent, high-contrast custom icon */
                  input[type="date"]::-webkit-calendar-picker-indicator,
                  input[type="date"]::calendar-picker-indicator {
                    opacity: 0 !important;
                    pointer-events: none !important;
                  }
                `}</style>
                <button
                  type="button"
                  aria-label="日付を選択"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground hover:text-foreground/80"
                  onClick={() => {
                    const el: any = occurrenceRef?.current;
                    if (!el) return;
                    if (typeof el.showPicker === 'function') {
                      el.showPicker();
                    } else {
                      el.focus();
                      el.click();
                    }
                  }}
                >
                  <CalendarIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee">
                {t('newClaim.assignee')}
              </Label>
              <Input
                id="assignee"
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                placeholder="例: 営業部 山田"
                data-testid="input-assignee"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{t('newClaim.dc')} / {t('newClaim.quantity')} <span className="text-destructive">*</span></Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDcItem}
                data-testid="button-add-dc"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('newClaim.addDcItem')}
              </Button>
            </div>
            {formData.dcItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <Input
                    value={item.dc}
                    onChange={(e) => updateDcItem(index, 'dc', e.target.value)}
                    placeholder="例: DC-001"
                    data-testid={`input-dc-${index}`}
                    required
                  />
                </div>
                <div className="w-32 space-y-2">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateDcItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    data-testid={`input-quantity-${index}`}
                    required
                  />
                </div>
                {formData.dcItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDcItem(index)}
                    data-testid={`button-remove-dc-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="defect-name">
              {t('newClaim.defectName')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="defect-name"
              value={formData.defectName}
              onChange={(e) => setFormData({ ...formData, defectName: e.target.value })}
              placeholder="例: エンジンから異音が発生"
              required
              data-testid="input-defect-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">
              {t('newClaim.remarks')}
            </Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="その他の詳細情報"
              className="min-h-24"
              data-testid="input-remarks"
            />
          </div>

          <div className="space-y-2">
            <Label>{t('newClaim.attachments')}</Label>
            <FileUpload onFilesChange={(files) => setFormData({ ...formData, files })} />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            data-testid="button-cancel"
          >
            {t('newClaim.cancel')}
          </Button>
          <Button type="submit" data-testid="button-submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {t('newClaim.submit')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
