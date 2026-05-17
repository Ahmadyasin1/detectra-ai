import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { POST_AUTH_PATH, isPublicRoute } from '../constants/routes';
import { openAuthModal } from '../lib/openAuth';

type AuthRouteHandlerProps = {
  mode: 'signin' | 'signup';
};

/**
 * /signin and /signup always open the auth popup, then return user to a safe route.
 */
export default function AuthRouteHandler({ mode }: AuthRouteHandlerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const fromState = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    sessionStorage.setItem('oauth_redirect_path', POST_AUTH_PATH);

    const redirectTo =
      fromState && isPublicRoute(fromState) ? fromState : '/';

    openAuthModal(mode);
    navigate(redirectTo, { replace: true });
  }, [mode, location.state, navigate]);

  return null;
}
