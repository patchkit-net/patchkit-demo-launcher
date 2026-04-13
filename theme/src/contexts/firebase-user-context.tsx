import { useMutation } from "@tanstack/react-query";
import {
  configureOauth2LoopbackDefaultServer,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";
import {
  useOauth2LoopbackRequestRegisteredListener,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-extras";
import * as FirebaseAuth from "firebase/auth";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { firebaseAuth } from "@/lib/firebase/auth";
import { generateUserOauth2CodeVerifier } from "@/lib/generate-user-oauth2-code-verifier";
import { getUserOauth2CodeChallenge } from "@/lib/get-user-oauth2-code-challange";
import { UserAuth } from "@/lib/user-auth";
import { UserCredentials } from "@/lib/user-credentials";

interface SignInFirebaseUserWithGoogleTaskState {
  firebaseUserGoogleOauth2CodeVerifier: string;
  firebaseUserGoogleOauth2RedirectUri: string;
}

const FIREBASE_GOOGLE_OAUTH2_CLIENT_ID = `301007649698-71lvhjg7p157u01vj13e93a4ctvpfgtn.apps.googleusercontent.com`;
const FIREBASE_GOOGLE_OAUTH2_CLIENT_SECRET = `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`;

interface UserContextValue {
  userAuth: UserAuth | undefined;
  signInUserWithCredentialsMutation: ReturnType<typeof useMutation<
    void,
    unknown,
    {
      userCredentials: UserCredentials;
    }
  >>;
  startSignInUserWithGoogleTaskMutation: ReturnType<typeof useMutation<void, unknown>>;
  signOutUserMutation: ReturnType<typeof useMutation<void, unknown>>;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const UserContext = createContext<UserContextValue>(undefined!);

export function UserContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuth.User | null>(firebaseAuth.currentUser);

  useEffect(
    () => {
      return FirebaseAuth.onAuthStateChanged(
        firebaseAuth,
        (firebaseNewUser) => {
          setFirebaseUser(firebaseNewUser);
        },
      );
    },
    [],
  );

  const [userAuth, setUserAuth] = useState<UserAuth | undefined>(undefined);

  useEffect(
    () => {
      if (firebaseUser === null) {
        setUserAuth(undefined);
      } else {
        setUserAuth({
          id: firebaseUser.uid,
          displayName: firebaseUser.displayName ?? firebaseUser.email ?? "Anonymous",
        });
      }
    },
    [
      firebaseUser,
      firebaseUser?.displayName,
      firebaseUser?.email,
    ],
  );

  const signInUserWithCredentialsMutation: UserContextValue["signInUserWithCredentialsMutation"] = useMutation({
    mutationFn: async (
      {
        userCredentials,
      },
    ) => {
      await FirebaseAuth.signInWithEmailAndPassword(
        firebaseAuth,
        userCredentials.email,
        userCredentials.password,
      );
    },
  });

  const [
    signInFirebaseUserWithGoogleTaskState,
    setSignInFirebaseUserWithGoogleTaskState,
  ] = useState<SignInFirebaseUserWithGoogleTaskState | undefined>(undefined);

  const startSignInUserWithGoogleTaskMutation: UserContextValue["startSignInUserWithGoogleTaskMutation"] = useMutation({
    mutationFn: async () => {
      const firebaseUserGoogleOauth2CodeVerifier = generateUserOauth2CodeVerifier();

      const { oauth2LoopbackDefaultServerUrl } = await configureOauth2LoopbackDefaultServer({
        oauth2LoopbackDefaultServerConfig: {
          redirectUrl: `https://google.com`,
        },
      });

      const firebaseUserGoogleOauth2RedirectUri = `${String(oauth2LoopbackDefaultServerUrl)}/google-auth`;

      setSignInFirebaseUserWithGoogleTaskState({
        firebaseUserGoogleOauth2CodeVerifier,
        firebaseUserGoogleOauth2RedirectUri,
      });

      const firebaseUserGoogleOauth2CodeChallenge = await getUserOauth2CodeChallenge({
        userOauth2CodeVerifier: firebaseUserGoogleOauth2CodeVerifier,
      });

      let firebaseUserGoogleOauth2SignInUrl = `https://accounts.google.com/o/oauth2/v2/auth?`;

      firebaseUserGoogleOauth2SignInUrl += `client_id=${FIREBASE_GOOGLE_OAUTH2_CLIENT_ID}&`;
      firebaseUserGoogleOauth2SignInUrl += `scope=profile&`;
      firebaseUserGoogleOauth2SignInUrl += `redirect_uri=${encodeURIComponent(firebaseUserGoogleOauth2RedirectUri)}&`;
      firebaseUserGoogleOauth2SignInUrl += `response_type=code&`;
      firebaseUserGoogleOauth2SignInUrl += `code_challenge=${firebaseUserGoogleOauth2CodeChallenge}&`;
      firebaseUserGoogleOauth2SignInUrl += `code_challenge_method=S256`;

      window.open(
        firebaseUserGoogleOauth2SignInUrl,
        `_blank`,
      );
    },
  });

  useOauth2LoopbackRequestRegisteredListener(
    useCallback(
      async (
        {
          oauth2LoopbackRequestInfo,
        },
      ) => {
        try {
          const oauth2LoopbackRequestUrlAsObject = new URL(oauth2LoopbackRequestInfo.url);

          if (oauth2LoopbackRequestUrlAsObject.pathname.includes(`google-auth`)) {
            const firebaseUserGoogleOauth2Code = oauth2LoopbackRequestUrlAsObject.searchParams.get(`code`);

            if (firebaseUserGoogleOauth2Code !== null && signInFirebaseUserWithGoogleTaskState !== undefined) {
              const tokenEndpointResponse = await fetch(
                `https://oauth2.googleapis.com/token`,
                {
                  method: `POST`,
                  headers: {
                    [`Content-Type`]: `application/x-www-form-urlencoded`,
                  },
                  body: new URLSearchParams({
                    code: firebaseUserGoogleOauth2Code,
                    client_id: FIREBASE_GOOGLE_OAUTH2_CLIENT_ID,
                    client_secret: FIREBASE_GOOGLE_OAUTH2_CLIENT_SECRET,
                    grant_type: `authorization_code`,
                    code_verifier: signInFirebaseUserWithGoogleTaskState.firebaseUserGoogleOauth2CodeVerifier,
                    redirect_uri: signInFirebaseUserWithGoogleTaskState.firebaseUserGoogleOauth2RedirectUri,
                  }),
                },
              );

              if (tokenEndpointResponse.ok) {
                const responseBody = await tokenEndpointResponse.json() as {
                  id_token: string;
                  access_token: string;
                };

                await FirebaseAuth.signInWithCredential(
                  firebaseAuth,
                  FirebaseAuth.GoogleAuthProvider.credential(responseBody.id_token, responseBody.access_token),
                );
              } else {
                console.error(tokenEndpointResponse);
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
      },
      [
        signInFirebaseUserWithGoogleTaskState,
      ],
    ),
  );

  const signOutUserMutation: UserContextValue["signOutUserMutation"] = useMutation({
    mutationFn: async () => {
      await FirebaseAuth.signOut(firebaseAuth);
    },
  });

  const userContextValue = useMemo<UserContextValue>(
    () => {
      return {
        userAuth,
        signInUserWithCredentialsMutation,
        startSignInUserWithGoogleTaskMutation,
        signOutUserMutation,
      };
    },
    [
      userAuth,
      signInUserWithCredentialsMutation,
      startSignInUserWithGoogleTaskMutation,
      signOutUserMutation,
    ],
  );

  return (
    <UserContext.Provider
      value={userContextValue}
    >
      {children}
    </UserContext.Provider>
  );
}
