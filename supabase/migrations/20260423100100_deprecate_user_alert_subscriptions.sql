-- Deprecación de tabla huérfana sin uso en código cliente.
-- Se mantiene durante 90 días por si se retoma la feature; después eliminar.
-- Ver backlog privacidad.

ALTER TABLE public.user_alert_subscriptions
    RENAME TO _deprecated_user_alert_subscriptions;

COMMENT ON TABLE public._deprecated_user_alert_subscriptions IS
    'DEPRECATED 2026-04-21. Tabla sin uso en código cliente. '
    'Revisar en 90 días (2026-07-21) y eliminar si no se ha retomado la feature.';
