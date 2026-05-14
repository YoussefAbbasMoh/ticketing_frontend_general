import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, getAxiosErrorMessage } from '../../services/api';
import { getStoredLanguage, t } from '../../i18n';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import { ButtonBusyDots } from '../ui/LoadingSkeletons';

const AddWorkspacePage = () => {
  const navigate = useNavigate();
  const { updateUser, user } = useAuth();
  const [lang] = useState(getStoredLanguage());
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = String(companyName || '').trim();
    if (trimmed.length < 2) {
      setError(t(lang, 'valCompanyNameMin2'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await userAPI.createWorkspace({ companyName: trimmed, switchToNew: true });
      const token = res?.data?.token;
      const activeCompanyId = res?.data?.activeCompanyId;
      const u = res?.data?.user;
      if (!token || !u) {
        throw new Error('Unexpected response from server');
      }
      localStorage.setItem('token', token);
      updateUser(activeCompanyId ? { ...u, activeCompanyId: String(activeCompanyId) } : u);
      window.dispatchEvent(
        new CustomEvent('active-company-changed', {
          detail: { companyId: String(activeCompanyId || '') },
        })
      );
      navigate('/', { replace: true });
    } catch (err) {
      setError(getAxiosErrorMessage(err, t(lang, 'userAddFailed')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[70vh] bg-app-background px-4 py-8 font-cairo text-app-text">
      <div className="mx-auto max-w-lg">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 text-sm font-medium text-app-primary hover:underline"
        >
          {t(lang, 'back')}
        </button>
        <Card>
          <Card.Content className="space-y-4 p-6">
            <h1 className="text-2xl font-bold text-app-text">{t(lang, 'addWorkspaceTitle')}</h1>
            <p className="text-sm text-app-text-secondary">{t(lang, 'addWorkspaceSubtitle')}</p>
            {user && (
              <div className="rounded-lg border border-app-border bg-app-surface-variant px-3 py-2 text-sm text-app-text-secondary">
                {String(user.name || '').trim() ? (
                  <p className="font-medium text-app-text">{String(user.name).trim()}</p>
                ) : null}
                {user.email ? (
                  <p className={String(user.name || '').trim() ? 'text-app-text-secondary' : 'font-medium text-app-text'}>
                    {user.email}
                  </p>
                ) : null}
                <p className="mt-2 text-app-text-secondary">{t(lang, 'addWorkspaceOwnerHint')}</p>
              </div>
            )}
            {error && (
              <Alert variant="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t(lang, 'workspaceNameLabel')}
                name="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                disabled={busy}
              />
              <Button
                type="submit"
                variant="secondary"
                fullWidth
                disabled={busy}
                icon={busy ? <ButtonBusyDots className="text-white" /> : null}
              >
                {busy ? t(lang, 'workspaceCreating') : t(lang, 'workspaceCreate')}
              </Button>
            </form>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default AddWorkspacePage;
