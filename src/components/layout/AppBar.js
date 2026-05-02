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
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationBell from '../notifications/NotificationBell';
import CalendarToolbarButton from './CalendarToolbarButton';
import { useAuth } from '../../contexts/AuthContext';
import { getStoredLanguage, setStoredLanguage, t } from '../../i18n';

const AppBar = ({ onMenuClick }) => {
  const theme = useTheme();
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
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        boxShadow: 'none',
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundImage: 'none',
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
        <Typography
          variant="subtitle1"
          component="div"
          sx={{
            flexGrow: 1,
            textAlign: isRtl ? 'right' : 'left',
            fontWeight: 600,
            fontSize: '1rem',
          }}
        >
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
                  inputProps={{ 'aria-label': t(lang, 'language') }}
                  sx={{
                    direction: isRtl ? 'rtl' : 'ltr',
                    backgroundColor: theme.palette.background.paper,
                    '.MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.secondary },
                    '.MuiSvgIcon-root': { color: theme.palette.text.secondary },
                  }}
                >
                  <MenuItem value="ar">AR</MenuItem>
                  <MenuItem value="en">EN</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
          <CalendarToolbarButton lang={lang} />
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
                inputProps={{ 'aria-label': t(lang, 'language') }}
                  sx={{
                    direction: isRtl ? 'rtl' : 'ltr',
                    backgroundColor: theme.palette.background.paper,
                    '.MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.secondary },
                    '.MuiSvgIcon-root': { color: theme.palette.text.secondary },
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
                  inputProps={{ 'aria-label': t(lang, 'company') }}
                  sx={{
                    direction: isRtl ? 'rtl' : 'ltr',
                    backgroundColor: theme.palette.background.paper,
                    '.MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.secondary },
                    '.MuiSvgIcon-root': { color: theme.palette.text.secondary },
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
                <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5, display: 'block' }}>
                  {switchError}
                </Typography>
              )}
            </Box>
          )}
          {switchingCompany && <CircularProgress size={18} color="primary" />}
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};

export default AppBar;
