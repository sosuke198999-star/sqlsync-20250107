import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { Calendar, Languages, Plus, X, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  
  const [defaultDueDays, setDefaultDueDays] = useState(
    localStorage.getItem('defaultDueDays') || '7'
  );
  const [language, setLanguage] = useState(
    localStorage.getItem('language') || 'ja'
  );
  const [customerList, setCustomerList] = useState<string[]>(
    JSON.parse(localStorage.getItem('customerList') || '[]')
  );

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  const addCustomer = () => {
    setCustomerList([...customerList, '']);
  };

  const removeCustomer = (index: number) => {
    setCustomerList(customerList.filter((_, i) => i !== index));
  };

  const updateCustomer = (index: number, value: string) => {
    const next = [...customerList];
    next[index] = value;
    setCustomerList(next);
  };

  const handleSave = () => {
    const sanitizedCustomers = customerList.map(c => c.trim()).filter(Boolean);

    localStorage.setItem('defaultDueDays', defaultDueDays);
    localStorage.setItem('customerList', JSON.stringify(sanitizedCustomers));

    setCustomerList(sanitizedCustomers);
    
    toast({
      title: t('settings.saveSuccess'),
      description: t('settings.saveSuccessDesc'),
    });
    
    console.log('Settings saved:', {
      defaultDueDays,
      language,
      customerList: sanitizedCustomers,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
          {t('settings.title')}
        </h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      {/* Notification email settings removed; use dedicated /notifications page */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('settings.customerListTitle')}
          </CardTitle>
          <CardDescription>
            {t('settings.customerListDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                {t('settings.customerListLabel')}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomer}
                data-testid="button-add-customer"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('settings.addCustomer')}
              </Button>
            </div>
            {customerList.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('settings.noCustomers')}</p>
            )}
            {customerList.map((name, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => updateCustomer(index, e.target.value)}
                  placeholder={t('settings.customerPlaceholder')}
                  data-testid={`input-customer-${index}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCustomer(index)}
                  data-testid={`button-remove-customer-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('settings.dueDateTitle')}
          </CardTitle>
          <CardDescription>
            {t('settings.dueDateDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-due-days">
              {t('settings.defaultDueDate')}
            </Label>
            <Select value={defaultDueDays} onValueChange={setDefaultDueDays}>
              <SelectTrigger id="default-due-days" data-testid="select-default-due-days">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">{t('settings.days3')}</SelectItem>
                <SelectItem value="5">{t('settings.days5')}</SelectItem>
                <SelectItem value="7">{t('settings.days7')}</SelectItem>
                <SelectItem value="10">{t('settings.days10')}</SelectItem>
                <SelectItem value="14">{t('settings.days14')}</SelectItem>
                <SelectItem value="30">{t('settings.days30')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            {t('settings.language')}
          </CardTitle>
          <CardDescription>
            {t('settings.languageDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">
              {t('settings.language')}
            </Label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger id="language" data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ja">日本語 (Japanese)</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="th">ภาษาไทย (Thai)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" data-testid="button-save-settings">
          {t('settings.saveSettings')}
        </Button>
      </div>
    </div>
  );
}
