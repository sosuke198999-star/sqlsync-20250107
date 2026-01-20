import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge, { type ClaimStatus } from "./StatusBadge";
import { Calendar, User, Building2, FileText, Clock, Package, Hash, Paperclip, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Attachment, DcItem } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ClaimDetail {
  id: string;
  tcarNo: string;
  customerDefectId?: string;
  defectCode?: string;
  customerName: string;
  partNumber?: string;
  dc?: string;
  dcItems?: DcItem[];
  defectName: string;
  defectCount?: number;
  occurrenceDate?: string;
  status: ClaimStatus;
  receivedDate: string;
  dueDate?: string;
  remarks?: string;
  assignee?: string;
  createdBy?: string;
  assigneeTech?: string;
  assigneeFactory?: string;
  occurrenceProcess?: string;
  occurrenceAction?: string;
  countermeasureDc?: string;
  driveFileUrl?: string;
  attachments?: Attachment[];
  createdAt: string;
}

interface ClaimDetailViewProps {
  claim: ClaimDetail;
  onSaveDetails?: (payload: {
    customerDefectId: string;
    customerName: string;
    partNumber: string;
    defectName: string;
    defectCount: string;
    occurrenceDate: string;
    receivedDate: string;
    dueDate: string;
    assignee: string;
    defectCode: string;
    dcItems: DcItem[];
    occurrenceProcess: string;
    occurrenceAction: string;
    countermeasureDc: string;
    remarks: string;
  }) => void;
  isSaving?: boolean;
  canEdit?: boolean;
}

export default function ClaimDetailView({ claim, onSaveDetails, isSaving, canEdit }: ClaimDetailViewProps) {
  const { t } = useTranslation();
  const dcItems = claim.dcItems ?? [];
  const [defectCode, setDefectCode] = useState(claim.defectCode || "");
  const [customerDefectId, setCustomerDefectId] = useState(claim.customerDefectId || "");
  const [customerName, setCustomerName] = useState(claim.customerName || "");
  const [partNumber, setPartNumber] = useState(claim.partNumber || "");
  const [defectName, setDefectName] = useState(claim.defectName || "");
  const [defectCount, setDefectCount] = useState(
    claim.defectCount !== undefined && claim.defectCount !== null ? String(claim.defectCount) : ""
  );
  const [occurrenceDate, setOccurrenceDate] = useState(claim.occurrenceDate || "");
  const [receivedDate, setReceivedDate] = useState(claim.receivedDate || "");
  const [dueDate, setDueDate] = useState(claim.dueDate || "");
  const [assignee, setAssignee] = useState(claim.assignee || "");
  const [dcItemsState, setDcItemsState] = useState<DcItem[]>(dcItems);
  const [occurrenceProcess, setOccurrenceProcess] = useState(claim.occurrenceProcess || "");
  const [occurrenceAction, setOccurrenceAction] = useState(claim.occurrenceAction || "");
  const [countermeasureDc, setCountermeasureDc] = useState(claim.countermeasureDc || "");
  const [remarks, setRemarks] = useState(claim.remarks || "");
  const [isEditing, setIsEditing] = useState(false);
  const [customerOptions] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("customerList");
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [defectCodeOptions] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("defectCodeList");
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [occurrenceProcessOptions] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("occurrenceProcessList");
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    setDefectCode(claim.defectCode || "");
    setCustomerDefectId(claim.customerDefectId || "");
    setCustomerName(claim.customerName || "");
    setPartNumber(claim.partNumber || "");
    setDefectName(claim.defectName || "");
    setDefectCount(
      claim.defectCount !== undefined && claim.defectCount !== null ? String(claim.defectCount) : ""
    );
    setOccurrenceDate(claim.occurrenceDate || "");
    setReceivedDate(claim.receivedDate || "");
    setDueDate(claim.dueDate || "");
    setAssignee(claim.assignee || "");
    setDcItemsState(claim.dcItems ?? []);
    setOccurrenceProcess(claim.occurrenceProcess || "");
    setOccurrenceAction(claim.occurrenceAction || "");
    setCountermeasureDc(claim.countermeasureDc || "");
    setRemarks(claim.remarks || "");
  }, [claim]);

  const resolvedCustomerOptions =
    customerName && !customerOptions.includes(customerName)
      ? [...customerOptions, customerName]
      : customerOptions;
  const resolvedDefectCodeOptions =
    defectCode && !defectCodeOptions.includes(defectCode)
      ? [...defectCodeOptions, defectCode]
      : defectCodeOptions;
  const resolvedOccurrenceProcessOptions =
    occurrenceProcess && !occurrenceProcessOptions.includes(occurrenceProcess)
      ? [...occurrenceProcessOptions, occurrenceProcess]
      : occurrenceProcessOptions;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold" data-testid="text-tcar-no">
              {claim.tcarNo}
            </CardTitle>
            <div className="space-y-1 text-sm text-muted-foreground">
              {claim.customerDefectId && (
                <div>
                  {t('table.customerDefectId')}: {claim.customerDefectId}
                </div>
              )}
              {claim.defectCode && (
                <div>
                  {t('table.defectCode')}: {claim.defectCode}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={claim.status} />
            </div>
          </div>
          <div className="text-sm text-muted-foreground text-right">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{t('detail.createdAt')}: {new Date(claim.createdAt).toLocaleDateString('ja-JP')}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {t('table.customerName')}
                </div>
                <div className="font-medium" data-testid="text-customer-name">{claim.customerName}</div>
              </div>

              {claim.partNumber && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {t('table.partNumber')}
                  </div>
                  <div className="font-medium" data-testid="text-part-number">{claim.partNumber}</div>
                </div>
              )}

              {dcItems.length > 0 || claim.dc ? (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {t('table.dc')}
                  </div>
                  {dcItems.length > 0 ? (
                    <div className="font-medium flex flex-wrap gap-2" data-testid="text-dc">
                      {dcItems.map((item, index) => (
                        <span key={`${item.dc}-${index}`}>
                          {item.dc}: {item.quantity}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="font-medium" data-testid="text-dc">{claim.dc}</div>
                  )}
                </div>
              ) : null}

              <div>
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {t('detail.receivedDate')}
                </div>
                <div className="font-medium" data-testid="text-received-date">{claim.receivedDate}</div>
              </div>

              {claim.dueDate && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t('table.dueDate')}
                  </div>
                  <div className="font-medium" data-testid="text-due-date">{claim.dueDate}</div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {claim.defectCount !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {t('table.defectCount')}
                  </div>
                  <div className="font-medium" data-testid="text-defect-count">{claim.defectCount}</div>
                </div>
              )}

              {claim.occurrenceDate && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t('table.occurrenceDate')}
                  </div>
                  <div className="font-medium" data-testid="text-occurrence-date">{claim.occurrenceDate}</div>
                </div>
              )}

              {claim.createdBy && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {t('detail.createdBy')}
                  </div>
                  <div className="font-medium" data-testid="text-created-by">{claim.createdBy}</div>
                </div>
              )}

              {claim.assigneeTech && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {t('detail.techAssignee')}
                  </div>
                  <div className="font-medium" data-testid="text-assignee-tech">{claim.assigneeTech}</div>
                </div>
              )}

              {claim.assigneeFactory && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {t('detail.factoryAssignee')}
                  </div>
                  <div className="font-medium" data-testid="text-assignee-factory">{claim.assigneeFactory}</div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {t('table.defectName')}
            </div>
            <div className="text-sm leading-relaxed" data-testid="text-defect-name">
              {claim.defectName}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {t('table.occurrenceProcess')}
                </div>
                <div className="font-medium" data-testid="text-occurrence-process">
                  {claim.occurrenceProcess || '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {t('approvals.occurrenceAction')}
                </div>
                <div className="font-medium" data-testid="text-occurrence-action">
                  {claim.occurrenceAction || '-'}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {t('approvals.countermeasureDc')}
                </div>
                <div className="font-medium" data-testid="text-countermeasure-dc">
                  {claim.countermeasureDc || '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {t('table.remarks')}
                </div>
                <div className="text-sm leading-relaxed" data-testid="text-remarks">
                  {claim.remarks || '-'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg">{t('approvals.updateClaim')}</CardTitle>
            {canEdit && onSaveDetails && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing((prev) => !prev)}
                disabled={isSaving}
                data-testid="button-detail-edit"
              >
                {isEditing ? t('newClaim.cancel') : t('detail.edit')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div>
                <Label htmlFor="detail-customer-defect-id">{t('table.customerDefectId')}</Label>
                <Input
                  id="detail-customer-defect-id"
                  value={customerDefectId}
                  onChange={(e) => setCustomerDefectId(e.target.value)}
                  data-testid="input-detail-customer-defect-id"
                />
              </div>
              <div>
                <Label htmlFor="detail-customer-name">{t('table.customerName')}</Label>
                <Select
                  value={customerName}
                  onValueChange={setCustomerName}
                  disabled={resolvedCustomerOptions.length === 0}
                >
                  <SelectTrigger id="detail-customer-name" data-testid="select-detail-customer-name">
                    <SelectValue placeholder={t('newClaim.selectCustomer')} />
                  </SelectTrigger>
                  <SelectContent>
                    {resolvedCustomerOptions.length === 0 ? (
                      <SelectItem value="__no-customer" disabled>
                        {t('settings.noCustomers')}
                      </SelectItem>
                    ) : (
                      resolvedCustomerOptions.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="detail-part-number">{t('table.partNumber')}</Label>
                <Input
                  id="detail-part-number"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  data-testid="input-detail-part-number"
                />
              </div>
              <div>
                <Label htmlFor="detail-defect-name">{t('table.defectName')}</Label>
                <Input
                  id="detail-defect-name"
                  value={defectName}
                  onChange={(e) => setDefectName(e.target.value)}
                  data-testid="input-detail-defect-name"
                />
              </div>
              <div>
                <Label htmlFor="detail-defect-count">{t('table.defectCount')}</Label>
                <Input
                  id="detail-defect-count"
                  type="number"
                  min="0"
                  value={defectCount}
                  onChange={(e) => setDefectCount(e.target.value)}
                  data-testid="input-detail-defect-count"
                />
              </div>
              <div>
                <Label htmlFor="detail-occurrence-date">{t('table.occurrenceDate')}</Label>
                <Input
                  id="detail-occurrence-date"
                  value={occurrenceDate}
                  onChange={(e) => setOccurrenceDate(e.target.value)}
                  data-testid="input-detail-occurrence-date"
                />
              </div>
              <div>
                <Label htmlFor="detail-received-date">{t('detail.receivedDate')}</Label>
                <Input
                  id="detail-received-date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  data-testid="input-detail-received-date"
                />
              </div>
              <div>
                <Label htmlFor="detail-due-date">{t('table.dueDate')}</Label>
                <Input
                  id="detail-due-date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  data-testid="input-detail-due-date"
                />
              </div>
              <div>
                <Label htmlFor="detail-assignee">{t('table.assignee')}</Label>
                <Input
                  id="detail-assignee"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  data-testid="input-detail-assignee"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('table.dc')}</Label>
                {dcItemsState.length === 0 && (
                  <p className="text-sm text-muted-foreground">-</p>
                )}
                {dcItemsState.map((item, index) => (
                  <div key={`${item.dc}-${index}`} className="flex gap-2">
                    <Input
                      value={item.dc}
                      onChange={(e) => {
                        const next = [...dcItemsState];
                        next[index] = { ...next[index], dc: e.target.value };
                        setDcItemsState(next);
                      }}
                      placeholder={t('newClaim.dc')}
                      data-testid={`input-detail-dc-${index}`}
                    />
                    <Input
                      type="number"
                      min="0"
                      value={item.quantity ?? 0}
                      onChange={(e) => {
                        const next = [...dcItemsState];
                        const quantity = Number.parseInt(e.target.value || "0", 10);
                        next[index] = { ...next[index], quantity: Number.isNaN(quantity) ? 0 : quantity };
                        setDcItemsState(next);
                      }}
                      placeholder={t('newClaim.quantity')}
                      data-testid={`input-detail-dc-qty-${index}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setDcItemsState(dcItemsState.filter((_, i) => i !== index))
                      }
                      data-testid={`button-remove-detail-dc-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDcItemsState([...dcItemsState, { dc: "", quantity: 0 }])
                    }
                    data-testid="button-add-detail-dc"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t('newClaim.addDcItem')}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="detail-defect-code">{t('table.defectCode')}</Label>
                <Select
                  value={defectCode}
                  onValueChange={setDefectCode}
                  disabled={resolvedDefectCodeOptions.length === 0}
                >
                  <SelectTrigger id="detail-defect-code" data-testid="select-detail-defect-code">
                    <SelectValue placeholder={t('approvals.selectDefectCode')} />
                  </SelectTrigger>
                  <SelectContent>
                    {resolvedDefectCodeOptions.length === 0 ? (
                      <SelectItem value="__no-defect-code" disabled>
                        {t('approvals.noDefectCodeOptions')}
                      </SelectItem>
                    ) : (
                      resolvedDefectCodeOptions.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="detail-occurrence-process">{t('table.occurrenceProcess')}</Label>
                <Select
                  value={occurrenceProcess}
                  onValueChange={setOccurrenceProcess}
                  disabled={resolvedOccurrenceProcessOptions.length === 0}
                >
                  <SelectTrigger id="detail-occurrence-process" data-testid="select-detail-occurrence-process">
                    <SelectValue placeholder={t('approvals.selectOccurrenceProcess')} />
                  </SelectTrigger>
                  <SelectContent>
                    {resolvedOccurrenceProcessOptions.length === 0 ? (
                      <SelectItem value="__no-occurrence-process" disabled>
                        {t('approvals.noOccurrenceProcessOptions')}
                      </SelectItem>
                    ) : (
                      resolvedOccurrenceProcessOptions.map((process) => (
                        <SelectItem key={process} value={process}>
                          {process}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="detail-occurrence-action">{t('approvals.occurrenceAction')}</Label>
                <Textarea
                  id="detail-occurrence-action"
                  value={occurrenceAction}
                  onChange={(e) => setOccurrenceAction(e.target.value)}
                  className="min-h-24"
                  data-testid="input-detail-occurrence-action"
                />
              </div>
              <div>
                <Label htmlFor="detail-countermeasure-dc">{t('approvals.countermeasureDc')}</Label>
                <Input
                  id="detail-countermeasure-dc"
                  value={countermeasureDc}
                  onChange={(e) => setCountermeasureDc(e.target.value)}
                  data-testid="input-detail-countermeasure-dc"
                />
              </div>
              <div>
                <Label htmlFor="detail-remarks">{t('table.remarks')}</Label>
                <Textarea
                  id="detail-remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="min-h-24"
                  data-testid="input-detail-remarks"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDefectCode(claim.defectCode || "");
                    setCustomerDefectId(claim.customerDefectId || "");
                    setCustomerName(claim.customerName || "");
                    setPartNumber(claim.partNumber || "");
                    setDefectName(claim.defectName || "");
                    setDefectCount(
                      claim.defectCount !== undefined && claim.defectCount !== null
                        ? String(claim.defectCount)
                        : ""
                    );
                    setOccurrenceDate(claim.occurrenceDate || "");
                    setReceivedDate(claim.receivedDate || "");
                    setDueDate(claim.dueDate || "");
                    setAssignee(claim.assignee || "");
                    setDcItemsState(claim.dcItems ?? []);
                    setOccurrenceProcess(claim.occurrenceProcess || "");
                    setOccurrenceAction(claim.occurrenceAction || "");
                    setCountermeasureDc(claim.countermeasureDc || "");
                    setRemarks(claim.remarks || "");
                    setIsEditing(false);
                  }}
                  disabled={isSaving}
                  data-testid="button-cancel-detail"
                >
                  {t('newClaim.cancel')}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    onSaveDetails?.({
                      customerDefectId,
                      customerName,
                      partNumber,
                      defectName,
                      defectCount,
                      occurrenceDate,
                      receivedDate,
                      dueDate,
                      assignee,
                      defectCode,
                      dcItems: dcItemsState
                        .map((item) => ({
                          dc: item.dc.trim(),
                          quantity: Number.isFinite(item.quantity) ? item.quantity : 0,
                        }))
                        .filter((item) => item.dc),
                      occurrenceProcess,
                      occurrenceAction,
                      countermeasureDc,
                      remarks,
                    });
                    setIsEditing(false);
                  }}
                  disabled={isSaving}
                  data-testid="button-save-detail"
                >
                  {t('detail.save')}
                </Button>
              </div>
            </>
          ) : canEdit ? (
            <p className="text-sm text-muted-foreground">{t('detail.editHint')}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            {t('newClaim.attachments')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {claim.attachments && claim.attachments.length > 0 ? (
            <ul className="space-y-2">
              {claim.attachments.map((attachment, index) => (
                <li key={`${attachment.fileId}-${index}`} className="text-sm">
                  <a
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    {attachment.fileName || attachment.fileId}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">-</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('approvals.file')}</CardTitle>
        </CardHeader>
        <CardContent>
          {claim.driveFileUrl ? (
            <a className="text-primary underline" href={claim.driveFileUrl} target="_blank" rel="noreferrer">
              {t('common.view')}
            </a>
          ) : (
            <div className="text-muted-foreground">-</div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
