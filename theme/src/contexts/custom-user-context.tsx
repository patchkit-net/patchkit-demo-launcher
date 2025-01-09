import { useMutation } from "@tanstack/react-query";
import {
  createContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as typia from "typia";

import { UserAuth } from "@/lib/user-auth";
import { UserCredentials } from "@/lib/user-credentials";
import { UserCredentialsAreInvalid } from "@/lib/user-credentials-are-invalid";

interface UserInternalAuth {
  id: string;
  displayName: string;
  accessToken: string;
  accessTokenExpireDateTime: number;
  refreshToken: string;
}

interface UserInternalAuthStoreState {
  value: UserInternalAuth | undefined;
}

const USER_INTERNAL_AUTH_STORE_STATE_LOCAL_STORAGE_KEY = "user-internal-auth-store-state";

const USER_INTERNAL_AUTH_STORE_DEFAULT_STATE: UserInternalAuthStoreState = {
  value: undefined,
};

function fetchUserInternalAuthStoreState(): UserInternalAuthStoreState {
  const userInternalAuthStoreStateAsJson = localStorage.getItem(USER_INTERNAL_AUTH_STORE_STATE_LOCAL_STORAGE_KEY);

  if (userInternalAuthStoreStateAsJson === null) {
    return USER_INTERNAL_AUTH_STORE_DEFAULT_STATE;
  }

  try {
    const userInternalAuthStoreState = JSON.parse(userInternalAuthStoreStateAsJson) as unknown;

    if (!typia.is<UserInternalAuthStoreState>(userInternalAuthStoreState)) {
      return USER_INTERNAL_AUTH_STORE_DEFAULT_STATE;
    }

    return userInternalAuthStoreState;
  } catch {
    return USER_INTERNAL_AUTH_STORE_DEFAULT_STATE;
  }
}

function setUserInternalAuthStoreState(
  {
    userInternalAuthStoreState,
  }: {
    userInternalAuthStoreState: UserInternalAuthStoreState;
  },
) {
  const userInternalAuthStoreStateAsJson = JSON.stringify(userInternalAuthStoreState);

  localStorage.setItem(USER_INTERNAL_AUTH_STORE_STATE_LOCAL_STORAGE_KEY, userInternalAuthStoreStateAsJson);
}

async function fetchUserInternalAuthWithCredentials(
  {
    userCredentials,
  }: {
    userCredentials: UserCredentials;
  },
): Promise<UserInternalAuth> {
  console.log("SIMULATION: Delaying fetchUserInternalAuthWithCredentials by 1 second");
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (userCredentials.email === "invalid") {
    console.log("SIMULATION: Mocking fetchUserInternalAuthWithCredentials with UserCredentialsAreInvalid error");
    throw new UserCredentialsAreInvalid();
  }

  if (userCredentials.email === "error") {
    console.log("SIMULATION: Mocking fetchUserInternalAuthWithCredentials with generic error");
    throw new Error();
  }

  // IMPLEMENT: Call the API to acquire access token

  console.log(`SIMULATION: Mocking fetchUserInternalAuthWithCredentials with successful result`);

  return {
    id: "fake-id",
    displayName: "user@yourcompany.com",
    accessToken: "fake-access-token",
    accessTokenExpireDateTime: Date.now() + 1000 * 60 * 60, /* 1 hour */
    refreshToken: "fake-refresh-token",
  };
}

async function fetchUserInternalAuthWithRefreshToken(
  {
  }: {
    userRefreshToken: string;
  },
): Promise<UserInternalAuth> {
  console.log("SIMULATION: Delaying fetchUserInternalAuthWithRefreshToken by 1 second");
  await new Promise(resolve => setTimeout(resolve, 1000));

  // IMPLEMENT: Call the API to acquire access and refresh tokens

  console.log(`SIMULATION: Mocking fetchUserInternalAuthWithRefreshToken with successful result`);

  return {
    id: "fake-id",
    displayName: "user@yourcompany.com",
    accessToken: "fake-access-token",
    accessTokenExpireDateTime: Date.now() + 1000 * 60 * 60, /* 1 hour */
    refreshToken: "fake-refresh-token",
  };
}

function getIsUserAccessTokenAboutToExpire(
  {
    userAccessTokenExpireDateTime,
  }: {
    userAccessTokenExpireDateTime: number;
  },
) {
  const isUserAccessTokenAboutToExpire = userAccessTokenExpireDateTime - Date.now() < 1000 * 60 * 5; /* 5 minutes */

  return isUserAccessTokenAboutToExpire;
}

async function invalidateUserInternalAuth(
  {
  }: {
    userInternalAuth: UserInternalAuth;
  },
): Promise<void> {
  console.log("SIMULATION: Delaying invalidateUserInternalAuth by 1 second");
  await new Promise(resolve => setTimeout(resolve, 1000));

  // IMPLEMENT: Call the API to invalidate access token

  console.log(`SIMULATION: Mocking invalidateUserInternalAuth with successful result`);
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
  const [userInternalAuth, setUserInternalAuth] = useState<UserInternalAuth | undefined>(
    fetchUserInternalAuthStoreState().value,
  );

  const [shouldCheckUserAccessToken, setShouldCheckUserAccessToken] = useState<boolean>(true);

  useEffect(
    () => {
      if (!shouldCheckUserAccessToken) {
        return;
      }

      setShouldCheckUserAccessToken(false);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      (async () => {
        try {
          if (userInternalAuth === undefined) {
            return;
          }

          if (
            getIsUserAccessTokenAboutToExpire({
              userAccessTokenExpireDateTime: userInternalAuth.accessTokenExpireDateTime,
            })
          ) {
            const userNewInternalAuth = await fetchUserInternalAuthWithRefreshToken({
              userRefreshToken: userInternalAuth.refreshToken,
            });

            setUserInternalAuth(userNewInternalAuth);

            setUserInternalAuthStoreState({
              userInternalAuthStoreState: {
                value: userNewInternalAuth,
              },
            });
          }
        } finally {
          await new Promise(resolve => setTimeout(resolve, 5000));

          setShouldCheckUserAccessToken(true);
        }
      })();
    },
    [
      shouldCheckUserAccessToken,
      userInternalAuth,
    ],
  );

  const signInUserWithCredentialsMutation: UserContextValue["signInUserWithCredentialsMutation"] = useMutation({
    mutationFn: async (
      {
        userCredentials,
      },
    ) => {
      const userNewInternalAuth = await fetchUserInternalAuthWithCredentials({
        userCredentials,
      });

      setUserInternalAuth(userNewInternalAuth);

      setUserInternalAuthStoreState({
        userInternalAuthStoreState: {
          value: userNewInternalAuth,
        },
      });
    },
  });

  const startSignInUserWithGoogleTaskMutation: UserContextValue["startSignInUserWithGoogleTaskMutation"] = useMutation({
    mutationFn: async () => {
      // TODO:
    },
  });

  const startSignInUserWithTwitterTaskMutation: UserContextValue["startSignInUserWithTwitterTaskMutation"] = useMutation({
    mutationFn: async () => {
      // TODO:
    },
  });

  const signOutUserMutation: UserContextValue["signOutUserMutation"] = useMutation({
    mutationFn: async () => {
      if (userInternalAuth !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        invalidateUserInternalAuth({ userInternalAuth: userInternalAuth }).catch();
      }

      setUserInternalAuth(undefined);

      setUserInternalAuthStoreState({
        userInternalAuthStoreState: {
          value: undefined,
        },
      });
    },
  });

  const userContextValue = useMemo<UserContextValue>(
    () => {
      return {
        userAuth: userInternalAuth === undefined
          ? undefined
          : {
              id: userInternalAuth.id,
              displayName: userInternalAuth.displayName,
            },
        signInUserWithCredentialsMutation,
        startSignInUserWithGoogleTaskMutation,
        startSignInUserWithTwitterTaskMutation,
        signOutUserMutation,
      };
    },
    [
      userInternalAuth,
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
