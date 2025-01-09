import { useMutation } from "@tanstack/react-query";
import {
  createContext,
  ReactNode,
  useContext,
} from "react";

import { CUSTOMIZATION } from "@/customization";
import { UserAuth } from "@/lib/user-auth";
import { UserCredentials } from "@/lib/user-credentials";

import { UserContext as CustomUserContext } from "./custom-user-context";
import { UserContext as FirebaseUserContext } from "./firebase-user-context";

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

export const UserContext = createContext<UserContextValue>(undefined!);

export function UserContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const customUserContextValue = useContext(CustomUserContext);
  const firebaseUserContextValue = useContext(FirebaseUserContext);

  let userContextValue: UserContextValue;

  switch (CUSTOMIZATION.userProviderType) {
    case "mock": {
      userContextValue = customUserContextValue;
      break;
    }
    case "firebase": {
      userContextValue = firebaseUserContextValue;
      break;
    }
  }

  return (
    <UserContext.Provider value={userContextValue}>
      {children}
    </UserContext.Provider>
  );
}
