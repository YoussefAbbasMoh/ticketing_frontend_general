import React, { useMemo, useState } from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import NotificationBell from '../notifications/NotificationBell';
import { useAuth } from '../../contexts/AuthContext';
import { getStoredLanguage, setStoredLanguage, t } from '../../i18n';

const AppBar = ({ onMenuClick }) => {
  const { user, switchActiveCompany } = useAuth();
  const [switchingCompany, setSwitchingCompany] = useState(false);
  const [switchError, setSwitchError] = useState('');
  const [lang, setLang] = useState(getStoredLanguage());
  const isRtl = lang === 'ar';

  const normalizedCompanies = useMemo(() => {
    const list = user?.companies || [];
    return list
      .map((entry) => {
        const idRaw = entry?.companyId ?? entry?.company?._id ?? entry?.company;
        if (!idRaw) return null;
        const companyId = String(idRaw);
        return {
          companyId,
          name: entry?.company?.name || `Company ${companyId.slice(-4)}`,
          companyRole: entry?.companyRole || 'user',
          isOwner: Boolean(entry?.isOwner),
        };
      })
      .filter(Boolean);
  }, [user]);

  const activeCompanyId = useMemo(() => {
    if (user?.activeCompanyId) return String(user.activeCompanyId);
    return normalizedCompanies.length === 1 ? normalizedCompanies[0].companyId : '';
  }, [user, normalizedCompanies]);

  const handleCompanyChange = async (event) => {
    const selectedId = String(event.target.value || '');
    if (!selectedId || selectedId === activeCompanyId) return;

    setSwitchError('');
    setSwitchingCompany(true);
    try {
      await switchActiveCompany(selectedId);
      window.dispatchEvent(
        new CustomEvent('active-company-changed', {
          detail: { companyId: selectedId },
        })
      );
    } catch (error) {
      setSwitchError(
        error?.response?.data?.message || 'Could not switch company. Please try again.'
      );
    } finally {
      setSwitchingCompany(false);
    }
  };

  return (
    <MuiAppBar
      position="static"
      sx={{
        backgroundColor: '#0e1121',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar sx={{ direction: isRtl ? 'rtl' : 'ltr' }}>
        <IconButton
          edge={isRtl ? 'end' : 'start'}
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={isRtl ? { ml: 2 } : { mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: isRtl ? 'right' : 'left' }}>
          {t(lang, 'appTitle')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          {!isRtl && (
            <Box sx={{ minWidth: 100 }}>
              <FormControl fullWidth size="small">
                <Select
                  value={lang}
                  onChange={(e) => {
                    const nextLang = e.target.value;
                    setLang(nextLang);
                    setStoredLanguage(nextLang);
                  }}
                  sx={{
                    color: 'white',
                    direction: isRtl ? 'rtl' : 'ltr',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.35)' },
                    '.MuiSvgIcon-root': { color: 'white' },
                  }}
                >
                  <MenuItem value="ar">AR</MenuItem>
                  <MenuItem value="en">EN</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
          <NotificationBell lang={lang} />
          {isRtl && (
            <Box sx={{ minWidth: 100 }}>
            <FormControl fullWidth size="small">
              <Select
                value={lang}
                onChange={(e) => {
                  const nextLang = e.target.value;
                  setLang(nextLang);
                  setStoredLanguage(nextLang);
                }}
                sx={{
                  color: 'white',
                  direction: isRtl ? 'rtl' : 'ltr',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.35)' },
                  '.MuiSvgIcon-root': { color: 'white' },
                }}
              >
                <MenuItem value="ar">AR</MenuItem>
                <MenuItem value="en">EN</MenuItem>
              </Select>
            </FormControl>
            </Box>
          )}
          {normalizedCompanies.length > 1 && (
            <Box sx={{ minWidth: 220 }}>
              <FormControl fullWidth size="small" disabled={switchingCompany}>
                <Select
                  value={activeCompanyId}
                  onChange={handleCompanyChange}
                  displayEmpty
                  sx={{
                    color: 'white',
                    direction: isRtl ? 'rtl' : 'ltr',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.35)' },
                    '.MuiSvgIcon-root': { color: 'white' },
                  }}
                >
                  {normalizedCompanies.map((company) => (
                    <MenuItem key={company.companyId} value={company.companyId}>
                      {company.name} {company.isOwner ? '(Owner)' : `(${company.companyRole})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {switchError && (
                <Typography variant="caption" sx={{ color: '#ffb4b4', mt: 0.5, display: 'block' }}>
                  {switchError}
                </Typography>
              )}
            </Box>
          )}
          {switchingCompany && <CircularProgress size={18} sx={{ color: 'white' }} />}
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};

export default AppBar;
