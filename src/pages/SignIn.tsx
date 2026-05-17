import AuthRouteHandler from './AuthRouteHandler';

/** Legacy route — opens auth popup and redirects (see App routes). */
export default function SignIn() {
  return <AuthRouteHandler mode="signin" />;
}
