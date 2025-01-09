import { useMutation } from "@tanstack/react-query";
import {
  callNodeFetch,
  configureOauth2LoopbackDefaultServer,
  dismissOauth2LoopbackPendingRequest,
  dismissProtocolPendingRequest,
  fetchOauth2LoopbackPendingRequestsInfo,
  fetchProtocolPendingRequestsInfo,
} from "@upsoft/patchkit-launcher-runtime-api-react-theme-client";
import * as CryptoJS from "crypto-js";
import * as FirebaseAuth from "firebase/auth";
import { default as Oauth } from "oauth-1.0a";
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

const FIREBASE_TWITTER_API_KEY = `TODO`;
const FIREBASE_TWITTER_API_SECRET = `TODO`;
const FIREBASE_TWITTER_OAUTH = new Oauth({
  consumer: {
    key: FIREBASE_TWITTER_API_KEY,
    secret: FIREBASE_TWITTER_API_SECRET,
  },
  signature_method: "HMAC-SHA1",
  hash_function: (message, key) => {
    return CryptoJS.HmacSHA1(message, key).toString(CryptoJS.enc.Base64); ;
  },
});

type CheckOauth2LoopbackPendingRequests = (
  {
  }: {
    oauth2LoopbackPendingRequestsInfo: Awaited<ReturnType<typeof fetchOauth2LoopbackPendingRequestsInfo>>;
  }
) => Promise<void>;

function useOauth2LoopbackPendingRequestsHandler(
  checkOauth2LoopbackPendingRequests: CheckOauth2LoopbackPendingRequests,
) {
  const [shouldCheck, setShouldCheck] = useState<boolean>(true);

  useEffect(
    () => {
      if (!shouldCheck) {
        return;
      }

      setShouldCheck(false);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      (async () => {
        try {
          const oauth2LoopbackPendingRequestsInfo = await fetchOauth2LoopbackPendingRequestsInfo({});

          await checkOauth2LoopbackPendingRequests({
            oauth2LoopbackPendingRequestsInfo,
          });
        } finally {
          await new Promise(resolve => setTimeout(resolve, 1000));

          setShouldCheck(true);
        }
      })();
    },
    [
      shouldCheck,
      checkOauth2LoopbackPendingRequests,
    ],
  );
}

type CheckProtocolPendingRequests = (
  {
  }: {
    protocolPendingRequestsInfo: Awaited<ReturnType<typeof fetchProtocolPendingRequestsInfo>>;
  }
) => Promise<void>;

function useProtocolPendingRequestsHandler(
  checkProtocolPendingRequests: CheckProtocolPendingRequests,
) {
  const [shouldCheck, setShouldCheck] = useState<boolean>(true);

  useEffect(
    () => {
      if (!shouldCheck) {
        return;
      }

      setShouldCheck(false);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      (async () => {
        try {
          const protocolPendingRequestsInfo = await fetchProtocolPendingRequestsInfo({});

          await checkProtocolPendingRequests({
            protocolPendingRequestsInfo,
          });
        } finally {
          await new Promise(resolve => setTimeout(resolve, 1000));

          setShouldCheck(true);
        }
      })();
    },
    [
      shouldCheck,
      checkProtocolPendingRequests,
    ],
  );
}

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
  startSignInUserWithTwitterTaskMutation: ReturnType<typeof useMutation<void, unknown>>;
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

  const startSignInUserWithTwitterTaskMutation: UserContextValue["startSignInUserWithTwitterTaskMutation"] = useMutation({
    mutationFn: async () => {
      const firebaseUserTwitterOauthCallback = `patchkit-demo-launcher://twitter-auth`;

      let requestTokenEndpointRequestUrl = `https://api.x.com/oauth/request_token?`;

      requestTokenEndpointRequestUrl += `oauth_callback=${encodeURIComponent(firebaseUserTwitterOauthCallback)}`;

      const requestTokenEndpointNodeFetchResult = await callNodeFetch({
        nodeFetchArgs: {
          input: requestTokenEndpointRequestUrl,
          init: {
            method: `POST`,
            headers: {
              Authorization: FIREBASE_TWITTER_OAUTH.toHeader(
                FIREBASE_TWITTER_OAUTH.authorize({
                  url: requestTokenEndpointRequestUrl,
                  method: `POST`,
                }),
              ).Authorization,
            },
          },
        },
      });

      if (requestTokenEndpointNodeFetchResult.error !== undefined) {
        console.error(requestTokenEndpointNodeFetchResult.error);
      } else {
        const requestTokenEndpointResponse = requestTokenEndpointNodeFetchResult.response;

        if (requestTokenEndpointResponse.ok) {
          const requestTokenEndpointResponseBody = new URLSearchParams(requestTokenEndpointResponse.bodyAsText);

          const firebaseUserTwitterOauthToken = requestTokenEndpointResponseBody.get("oauth_token");
          const firebaseUserTwitterOauthTokenSecret = requestTokenEndpointResponseBody.get("oauth_token_secret");

          if (firebaseUserTwitterOauthToken !== null && firebaseUserTwitterOauthTokenSecret !== null) {
            window.open(
              `https://api.x.com/oauth/authorize?oauth_token=${firebaseUserTwitterOauthToken}`,
              `_blank`,
            );
          }
        }
      }
    },
  });

  const checkOauth2LoopbackPendingRequests: CheckOauth2LoopbackPendingRequests = useCallback(
    async (
      {
        oauth2LoopbackPendingRequestsInfo,
      },
    ) => {
      for (const [oauth2LoopbackPendingRequestId, oauth2LoopbackPendingRequestInfo] of Object.entries(oauth2LoopbackPendingRequestsInfo)) {
        try {
          const oauth2LoopbackPendingRequestUrlAsObject = new URL(oauth2LoopbackPendingRequestInfo.url);

          if (oauth2LoopbackPendingRequestUrlAsObject.pathname.includes(`google-auth`)) {
            await dismissOauth2LoopbackPendingRequest({
              oauth2LoopbackPendingRequestId,
            });

            const firebaseUserGoogleOauth2Code = oauth2LoopbackPendingRequestUrlAsObject.searchParams.get(`code`);

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
      }
    },
    [
      signInFirebaseUserWithGoogleTaskState,
    ],
  );

  useOauth2LoopbackPendingRequestsHandler(checkOauth2LoopbackPendingRequests);

  const checkProtocolPendingRequests: CheckProtocolPendingRequests = useCallback(
    async (
      {
        protocolPendingRequestsInfo,
      },
    ) => {
      for (const [protocolPendingRequestId, protocolPendingRequestInfo] of Object.entries(protocolPendingRequestsInfo)) {
        try {
          const protocolPendingRequestUrlAsObject = new URL(protocolPendingRequestInfo.url);

          if (protocolPendingRequestUrlAsObject.pathname.includes(`twitter-auth`)) {
            await dismissProtocolPendingRequest({
              protocolPendingRequestId,
            });

            const firebaseUserTwitterOauthToken = protocolPendingRequestUrlAsObject.searchParams.get(`oauth_token`);
            const firebaseUserTwitterOauthVerifier = protocolPendingRequestUrlAsObject.searchParams.get(`oauth_verifier`);

            if (firebaseUserTwitterOauthToken !== null && firebaseUserTwitterOauthVerifier !== null) {
              let accessTokenEndpointRequestUrl = `https://api.x.com/oauth/access_token?`;

              accessTokenEndpointRequestUrl += `oauth_token=${firebaseUserTwitterOauthToken}&`;
              accessTokenEndpointRequestUrl += `oauth_verifier=${firebaseUserTwitterOauthVerifier}`;

              const accessTokenEndpointNodeFetchResult = await callNodeFetch({
                nodeFetchArgs: {
                  input: accessTokenEndpointRequestUrl,
                  init: {
                    method: `POST`,
                    headers: {
                      Authorization: FIREBASE_TWITTER_OAUTH.toHeader(
                        FIREBASE_TWITTER_OAUTH.authorize({
                          url: accessTokenEndpointRequestUrl,
                          method: `POST`,
                        }),
                      ).Authorization,
                    },
                  },
                },
              });

              if (accessTokenEndpointNodeFetchResult.error !== undefined) {
                console.error(accessTokenEndpointNodeFetchResult.error);
              } else {
                const accessTokenEndpointResponse = accessTokenEndpointNodeFetchResult.response;

                const accessTokenEndpointResponseBody = new URLSearchParams(accessTokenEndpointResponse.bodyAsText);

                const firebaseUserTwitterOauthAccessToken = accessTokenEndpointResponseBody.get("oauth_token");
                const firebaseUserTwitterOauthAccessTokenSecret = accessTokenEndpointResponseBody.get("oauth_token_secret");

                if (firebaseUserTwitterOauthAccessToken !== null && firebaseUserTwitterOauthAccessTokenSecret !== null) {
                  await FirebaseAuth.signInWithCredential(
                    firebaseAuth,
                    FirebaseAuth.TwitterAuthProvider.credential(
                      firebaseUserTwitterOauthAccessToken,
                      firebaseUserTwitterOauthAccessTokenSecret,
                    ),
                  );
                }
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    },
    [
    ],
  );

  useProtocolPendingRequestsHandler(checkProtocolPendingRequests);

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
        startSignInUserWithTwitterTaskMutation,
        signOutUserMutation,
      };
    },
    [
      userAuth,
      signInUserWithCredentialsMutation,
      startSignInUserWithGoogleTaskMutation,
      startSignInUserWithTwitterTaskMutation,
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
