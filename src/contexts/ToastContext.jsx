import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
} from '@mui/material';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [snack, setSnack] = useState({
    open: false,
    message: '',
    severity: 'error',
    duration: 6000,
    multiline: false,
  });

  const [dialog, setDialog] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: null,
    onConfirm: null,
  });

  const toast = useCallback((message, options = {}) => {
    const severity = options.severity || 'error';
    const duration =
      options.duration ?? (severity === 'error' || severity === 'warning' ? 8000 : 5000);
    setSnack({
      open: true,
      message,
      severity,
      duration,
      multiline: Boolean(options.multiline),
    });
  }, []);

  const closeSnack = useCallback((_, reason) => {
    if (reason === 'clickaway') return;
    setSnack((s) => ({ ...s, open: false }));
  }, []);

  const alertDialog = useCallback((opts) => {
    setDialog({
      open: true,
      title: opts.title || 'Notice',
      message: opts.message || '',
      confirmText: opts.confirmText || 'OK',
      cancelText: opts.cancelText ?? null,
      onConfirm: opts.onConfirm || null,
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog((d) => ({ ...d, open: false }));
  }, []);

  const handleDialogConfirm = () => {
    const fn = dialog.onConfirm;
    setDialog((d) => ({ ...d, open: false }));
    if (typeof fn === 'function') fn();
  };

  const value = useMemo(
    () => ({
      toast,
      alertDialog,
    }),
    [toast, alertDialog]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={snack.open}
        autoHideDuration={snack.duration}
        onClose={closeSnack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={closeSnack}
          severity={snack.severity}
          variant="filled"
          sx={{
            width: '100%',
            maxWidth: 'min(100vw - 32px, 560px)',
            alignItems: 'center',
            ...(snack.multiline ? { whiteSpace: 'pre-line' } : {}),
          }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
      <Dialog
        open={dialog.open}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
        aria-labelledby="app-toast-dialog-title"
      >
        <DialogTitle id="app-toast-dialog-title">{dialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ whiteSpace: 'pre-line' }}>{dialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {dialog.cancelText ? (
            <Button onClick={closeDialog} color="inherit">
              {dialog.cancelText}
            </Button>
          ) : null}
          <Button onClick={handleDialogConfirm} variant="contained" color="primary">
            {dialog.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
