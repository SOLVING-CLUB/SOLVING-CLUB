/**
 * Navigation Types
 */
export type RootStackParamList = {
  // Auth Screens
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  // App Screens
  Home: undefined;
  Hello: undefined;
  Dashboard: undefined;
  // Documents Screens
  DocumentsList: undefined;
  DocumentViewer: {documentId: string};
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

