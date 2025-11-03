import NewClaimForm, { type ClaimFormData } from "@/components/NewClaimForm";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Claim } from "@shared/schema";
import { useTranslation } from "react-i18next";

export default function NewClaim() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (data: ClaimFormData) => {
    try {
      const today = new Date();
      const receivedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const payload = {
        customerDefectId: data.customerDefectId || undefined,
        customerName: data.customerName,
        partNumber: data.partNumber || undefined,
        dcItems: data.dcItems,
        defectName: data.defectName,
        occurrenceDate: data.occurrenceDate || undefined,
        // status is omitted to use server default (PENDING_ACCEPTANCE)
        receivedDate,
        remarks: data.remarks || undefined,
        assignee: data.assignee || undefined,
      };

      const res = await apiRequest('POST', '/api/claims', payload);
      const created: Claim = await res.json();

      // Ensure lists/statistics reflect the new item
      await queryClient.invalidateQueries({ queryKey: ['/api/claims'] });

      // If files were selected during registration, upload them as attachments (separate from countermeasure doc)
      if (data.files && data.files.length > 0) {
        for (const file of data.files) {
          const form = new FormData();
          form.append('file', file);
          const uploadRes = await fetch(`/api/claims/${created.id}/upload-attachment`, {
            method: 'POST',
            body: form,
            credentials: 'include',
          });
          if (!uploadRes.ok) {
            const msg = (await uploadRes.text()) || uploadRes.statusText;
            throw new Error(msg);
          }
        }
      }

      toast({
        title: t('common.confirm'),
        description: `${t('newClaim.title')}: ${created.tcarNo}`,
      });

      setTimeout(() => {
        setLocation('/claims');
      }, 1200);
    } catch (err: any) {
      console.error('Failed to create claim', err);
      toast({
        title: "登録に失敗しました",
        description: err?.message || 'サーバーエラーが発生しました',
      });
    }
  };

  const handleCancel = () => {
    setLocation('/claims');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">{t('newClaim.title')}</h1>
        <p className="text-muted-foreground">{t('newClaim.subtitle')}</p>
      </div>

      <NewClaimForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
}
