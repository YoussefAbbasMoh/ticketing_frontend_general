import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import React from 'react';
import { useIsRtl } from '../../hooks/useIsRtl';

/**
 * “Back to home” arrow for dashboard sub-pages. Mirrors horizontally in RTL so
 * it points toward the logical start edge (same as English LTR).
 */
export default function NavBackIcon({ sx = {}, ...rest }) {
  const isRtl = useIsRtl();
  return (
    <ArrowBackRounded
      sx={{ fontSize: 22, ...(isRtl ? { transform: 'scaleX(-1)' } : {}), ...sx }}
      {...rest}
    />
  );
}
