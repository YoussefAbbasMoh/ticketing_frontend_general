import React, { useCallback, useEffect, useState } from 'react';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import { platformAdminAPI, getAxiosErrorMessage } from '../../../services/api';
import { getStoredLanguage, t } from '../../../i18n';
import { useToast } from '../../../contexts/ToastContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Skeleton from '../../ui/Skeleton';
import AdminShell from './ui/AdminShell';
import AdminPageHeader from './ui/AdminPageHeader';

function planToDraft(plan) {
  const lim = plan.limits || {};
  const membersNull = lim.maxMembers == null;
  const projectsNull = lim.maxProjects == null;
  return {
    name: plan.name || '',
    description: plan.description || '',
    price: plan.price ?? 0,
    currency: plan.currency || 'EGP',
    billingPeriod: plan.billingPeriod || 'monthly',
    trialDays: plan.trialDays ?? 0,
    isActive: plan.isActive !== false,
    isPopular: !!plan.isPopular,
    paymobIntegrationId: plan.paymobIntegrationId ?? '',
    paymobSubscriptionPlanId: plan.paymobSubscriptionPlanId ?? '',
    featuresText: (plan.features || []).join('\n'),
    membersUnlimited: membersNull,
    maxMembers: membersNull ? '' : String(lim.maxMembers),
    projectsUnlimited: projectsNull,
    maxProjects: projectsNull ? '' : String(lim.maxProjects),
    canUploadChatAttachments: !!lim.canUploadChatAttachments,
    canEditAttendance: !!lim.canEditAttendance,
    canDownloadAttendanceReport: !!lim.canDownloadAttendanceReport,
  };
}

export default function AdminPlansPage() {
  const { toast } = useToast();
  const [lang, setLang] = useState(getStoredLanguage());
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await platformAdminAPI.getPlanCatalog();
      const list = res.data.plans || [];
      setPlans(list);
      const next = {};
      list.forEach((p) => {
        next[p.id] = planToDraft(p);
      });
      setDrafts(next);
    } catch (e) {
      toast(getAxiosErrorMessage(e), { severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onLang = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLang);
    return () => window.removeEventListener('language-changed', onLang);
  }, []);

  const updateDraft = (planId, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [planId]: { ...prev[planId], ...patch },
    }));
  };

  const buildPayload = (planId, d) => {
    const limits = {
      canUploadChatAttachments: d.canUploadChatAttachments,
      canEditAttendance: d.canEditAttendance,
      canDownloadAttendanceReport: d.canDownloadAttendanceReport,
    };
    if (d.membersUnlimited) limits.maxMembers = null;
    else {
      const n = parseInt(String(d.maxMembers || '').trim(), 10);
      limits.maxMembers = Number.isFinite(n) ? n : 0;
    }
    if (d.projectsUnlimited) limits.maxProjects = null;
    else {
      const n = parseInt(String(d.maxProjects || '').trim(), 10);
      limits.maxProjects = Number.isFinite(n) ? n : 0;
    }

    return {
      name: d.name.trim(),
      description: d.description.trim(),
      price: Number(d.price) || 0,
      currency: String(d.currency || 'EGP').trim(),
      billingPeriod: String(d.billingPeriod || 'monthly').trim(),
      trialDays: parseInt(String(d.trialDays || 0), 10) || 0,
      isActive: !!d.isActive,
      isPopular: !!d.isPopular,
      paymobIntegrationId:
        d.paymobIntegrationId === '' || d.paymobIntegrationId == null
          ? null
          : Number(d.paymobIntegrationId),
      paymobSubscriptionPlanId:
        d.paymobSubscriptionPlanId === '' || d.paymobSubscriptionPlanId == null
          ? null
          : Number(d.paymobSubscriptionPlanId),
      features: String(d.featuresText || '')
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean),
      limits,
    };
  };

  const savePlan = async (planId) => {
    const d = drafts[planId];
    if (!d) return;
    setSavingId(planId);
    try {
      await platformAdminAPI.updatePlanCatalog(planId, buildPayload(planId, d));
      toast(t(lang, 'adminPlansSaved'), { severity: 'success' });
      await load();
    } catch (e) {
      toast(getAxiosErrorMessage(e), { severity: 'error' });
    } finally {
      setSavingId(null);
    }
  };

  const resetOverride = async (planId) => {
    setSavingId(planId);
    try {
      await platformAdminAPI.deletePlanCatalogOverride(planId);
      toast(t(lang, 'adminPlansReset'), { severity: 'success' });
      await load();
    } catch (e) {
      toast(getAxiosErrorMessage(e), { severity: 'error' });
    } finally {
      setSavingId(null);
    }
  };

  const inputClass =
    'mt-1 min-h-[40px] w-full rounded-app-input border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-app-primary/20';

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Billing"
        title={t(lang, 'adminPlans')}
        description={t(lang, 'adminPlansHint')}
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => load()} disabled={loading}>
            {t(lang, 'adminPlansReload')}
          </Button>
        }
      />

      {loading && !plans.length ? (
        <div className="space-y-6 pb-12">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52 w-full rounded-app border border-app-divider shadow-app-soft" />
          ))}
        </div>
      ) : (
        <div className="space-y-6 pb-12">
          {plans.map((plan) => {
            const d = drafts[plan.id];
            if (!d) return null;
            return (
              <Card key={plan.id} className="overflow-hidden">
                <Card.Header className="!py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold capitalize text-app-text">{plan.id}</h2>
                      <p className="text-xs text-app-text-secondary">{plan.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={savingId === plan.id}
                        onClick={() => resetOverride(plan.id)}
                      >
                        {t(lang, 'adminPlansResetDefaults')}
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={savingId === plan.id}
                        onClick={() => savePlan(plan.id)}
                      >
                        {savingId === plan.id ? '…' : t(lang, 'adminPlansSave')}
                      </Button>
                    </div>
                  </div>
                </Card.Header>
                <Card.Content className="grid gap-4 md:grid-cols-2">
                  <Input
                    label={t(lang, 'adminPlansName')}
                    value={d.name}
                    onChange={(e) => updateDraft(plan.id, { name: e.target.value })}
                  />
                  <Input
                    label={t(lang, 'adminPlansPrice')}
                    type="number"
                    value={d.price}
                    onChange={(e) => updateDraft(plan.id, { price: e.target.value })}
                  />
                  <Input
                    label={t(lang, 'adminPlansCurrency')}
                    value={d.currency}
                    onChange={(e) => updateDraft(plan.id, { currency: e.target.value })}
                  />
                  <Input
                    label={t(lang, 'adminPlansBillingPeriod')}
                    value={d.billingPeriod}
                    onChange={(e) => updateDraft(plan.id, { billingPeriod: e.target.value })}
                  />
                  <Input
                    label={t(lang, 'adminPlansTrialDays')}
                    type="number"
                    value={d.trialDays}
                    onChange={(e) => updateDraft(plan.id, { trialDays: e.target.value })}
                  />
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-app-text">
                      <input
                        type="checkbox"
                        checked={d.isActive}
                        onChange={(e) => updateDraft(plan.id, { isActive: e.target.checked })}
                      />
                      {t(lang, 'adminPlansActive')}
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-app-text">
                      <input
                        type="checkbox"
                        checked={d.isPopular}
                        onChange={(e) => updateDraft(plan.id, { isPopular: e.target.checked })}
                      />
                      {t(lang, 'adminPlansPopular')}
                    </label>
                  </div>
                  <Input
                    label="Paymob integration id"
                    type="number"
                    value={d.paymobIntegrationId}
                    onChange={(e) => updateDraft(plan.id, { paymobIntegrationId: e.target.value })}
                  />
                  <Input
                    label="Paymob subscription plan id"
                    type="number"
                    value={d.paymobSubscriptionPlanId}
                    onChange={(e) => updateDraft(plan.id, { paymobSubscriptionPlanId: e.target.value })}
                  />
                  <div className="md:col-span-2">
                    <label className="mb-s8 block text-[13px] font-semibold text-app-text-secondary">
                      {t(lang, 'adminPlansDescription')}
                    </label>
                    <TextareaAutosize
                      className={`${inputClass} resize-none font-inherit`}
                      minRows={2}
                      maxRows={12}
                      value={d.description}
                      onChange={(e) => updateDraft(plan.id, { description: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-s8 block text-[13px] font-semibold text-app-text-secondary">
                      {t(lang, 'adminPlansFeatures')}
                    </label>
                    <TextareaAutosize
                      className={`${inputClass} resize-none font-mono text-xs`}
                      minRows={3}
                      maxRows={24}
                      value={d.featuresText}
                      onChange={(e) => updateDraft(plan.id, { featuresText: e.target.value })}
                      placeholder="One feature per line"
                    />
                  </div>

                  <div className="md:col-span-2 border-t border-app-divider pt-4">
                    <p className="mb-3 text-sm font-semibold text-app-text">{t(lang, 'adminPlansLimits')}</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-app-text">
                          <input
                            type="checkbox"
                            checked={d.membersUnlimited}
                            onChange={(e) =>
                              updateDraft(plan.id, { membersUnlimited: e.target.checked })
                            }
                          />
                          {t(lang, 'adminPlansMembersUnlimited')}
                        </label>
                        {!d.membersUnlimited ? (
                          <div className="mt-2">
                            <Input
                              label={t(lang, 'adminPlansMaxMembers')}
                              type="number"
                              value={d.maxMembers}
                              onChange={(e) => updateDraft(plan.id, { maxMembers: e.target.value })}
                            />
                          </div>
                        ) : null}
                      </div>
                      <div>
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-app-text">
                          <input
                            type="checkbox"
                            checked={d.projectsUnlimited}
                            onChange={(e) =>
                              updateDraft(plan.id, { projectsUnlimited: e.target.checked })
                            }
                          />
                          {t(lang, 'adminPlansProjectsUnlimited')}
                        </label>
                        {!d.projectsUnlimited ? (
                          <div className="mt-2">
                            <Input
                              label={t(lang, 'adminPlansMaxProjects')}
                              type="number"
                              value={d.maxProjects}
                              onChange={(e) => updateDraft(plan.id, { maxProjects: e.target.value })}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-6">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-app-text">
                        <input
                          type="checkbox"
                          checked={d.canUploadChatAttachments}
                          onChange={(e) =>
                            updateDraft(plan.id, { canUploadChatAttachments: e.target.checked })
                          }
                        />
                        {t(lang, 'adminPlansChatFiles')}
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-app-text">
                        <input
                          type="checkbox"
                          checked={d.canEditAttendance}
                          onChange={(e) =>
                            updateDraft(plan.id, { canEditAttendance: e.target.checked })
                          }
                        />
                        {t(lang, 'adminPlansEditAttendance')}
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-app-text">
                        <input
                          type="checkbox"
                          checked={d.canDownloadAttendanceReport}
                          onChange={(e) =>
                            updateDraft(plan.id, {
                              canDownloadAttendanceReport: e.target.checked,
                            })
                          }
                        />
                        {t(lang, 'adminPlansDownloadAttendance')}
                      </label>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
